/**
 * Cloudflare Worker — API Proxy for OnlinePDFPro
 * 
 * Routes:
 *   POST /ai/chat    — Groq LLM (text chat, summarizer, flashcards)
 *   POST /ai/vision  — OpenRouter (vision/multimodal models)
 *   POST /convert/token — Turnstile-gated short-lived conversion ticket
 *   POST /convert/pdf-to-word — Controlled PDF→DOCX gateway
 *   POST /convert/word-to-pdf — Controlled DOC/DOCX/ODT/RTF→PDF gateway
 *   POST /store/create-order — Create Razorpay order
 *   POST /store/verify-payment — Verify Razorpay payment and signature
 *   POST /store/razorpay-webhook — Fulfil captured Razorpay payments
 *   POST /store/download — Download an owned PDF from private R2
 *   POST /store/my-purchases — List the authenticated user's purchases
 *   GET  /health     — Health check
 * 
 * Deploy: npx wrangler deploy (from cf-worker directory)
 * 
 * Secrets (set via Wrangler CLI, never in wrangler.toml):
 *   - GROQ_API_KEY (secret: npx wrangler secret put GROQ_API_KEY)
 *   - OPENROUTER_API_KEY (secret: npx wrangler secret put OPENROUTER_API_KEY)
 *   - RAZORPAY_KEY_ID (secret: npx wrangler secret put RAZORPAY_KEY_ID)
 *   - RAZORPAY_KEY_SECRET (secret: npx wrangler secret put RAZORPAY_KEY_SECRET)
 *   - RAZORPAY_WEBHOOK_SECRET (secret: npx wrangler secret put RAZORPAY_WEBHOOK_SECRET)
 *   - SUPABASE_URL (secret: npx wrangler secret put SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY (secret: npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY)
 *   - TURNSTILE_SECRET_KEY (secret: npx wrangler secret put TURNSTILE_SECRET_KEY)
 *   - CONVERSION_SIGNING_SECRET (secret: npx wrangler secret put CONVERSION_SIGNING_SECRET)
 *   - MODAL_API_TOKEN (required in production for protected Modal endpoints)
 */

const PROD_ORIGINS = [
    'https://onlinepdfpro.com',
    'https://www.onlinepdfpro.com'
];

// Local dev origins — only included when ENVIRONMENT !== 'production'
const DEV_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
];

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // store/general request limit; vision has a separate limit
const MAX_CONVERSION_SIZE = 50 * 1024 * 1024;
const MAX_JSON_SIZE = 256 * 1024;
const MAX_VISION_JSON_SIZE = 40 * 1024 * 1024;
const MAX_AI_MESSAGES = 40;
const MAX_AI_MESSAGE_CHARS = 120_000;
const MAX_AI_IMAGE_CHARS = 32 * 1024 * 1024;
const CONVERSION_PATHS = new Set(['/convert/pdf-to-word', '/convert/word-to-pdf']);
const PROTECTED_PATHS = new Set([
    '/ai/chat', '/ai/vision', '/convert/token', ...CONVERSION_PATHS,
    '/store/create-order', '/store/verify-payment', '/store/download', '/store/my-purchases', '/store/razorpay-webhook'
]);

// Browser POSTs always send an Origin header from an allowed domain; curl and
// scripts do not. Requiring an allowed Origin on the paid endpoints blocks
// direct abuse of the Groq/OpenRouter keys while keeping the site working.
function getAllowedOrigins(env) {
    const isProd = (env.ENVIRONMENT || 'production') === 'production';
    return isProd ? PROD_ORIGINS : [...PROD_ORIGINS, ...DEV_ORIGINS];
}

function requestIp(request) {
    return request.headers.get('cf-connecting-ip') || 'unknown';
}

async function enforceRateLimit(request, env, pathname) {
    // Cloudflare's binding is backed by distributed state. Missing production
    // configuration is a deployment error, not a reason to silently fall back
    // to an in-memory map that disappears between Worker isolates.
    if (!env.API_RATE_LIMITER || typeof env.API_RATE_LIMITER.limit !== 'function') {
        const production = (env.ENVIRONMENT || 'production') === 'production';
        return { allowed: !production, unavailable: production };
    }
    try {
        const key = `${requestIp(request)}:${pathname}`;
        const result = await env.API_RATE_LIMITER.limit({ key });
        return { allowed: result?.success === true, unavailable: false };
    } catch (err) {
        console.error('[RateLimit] binding failed', err);
        return { allowed: false, unavailable: true };
    }
}

export default {
    async fetch(request, env) {
        const allowedOrigins = getAllowedOrigins(env);
        const url = new URL(request.url);
        const corsHeaders = getCORSHeaders(request, allowedOrigins);

        // CORS preflight
        if (request.method === 'OPTIONS') {
            return handleCORS(request, allowedOrigins);
        }

        const origin = request.headers.get('Origin') || '';
        if (origin && !allowedOrigins.includes(origin)) {
            return jsonResponse({ error: 'Origin not allowed.' }, 403, corsHeaders);
        }

        if (url.pathname !== '/health' && PROTECTED_PATHS.has(url.pathname)) {
            const rate = await enforceRateLimit(request, env, url.pathname);
            if (!rate.allowed) {
                return jsonResponse(
                    { error: rate.unavailable ? 'Service protection is temporarily unavailable.' : 'Rate limit exceeded. Try again shortly.' },
                    rate.unavailable ? 503 : 429,
                    corsHeaders
                );
            }
        }

        if (request.method === 'POST') {
            const contentLength = Number(request.headers.get('content-length') || 0);
            const limit = CONVERSION_PATHS.has(url.pathname) ? MAX_CONVERSION_SIZE :
                (url.pathname === '/ai/vision' ? MAX_VISION_JSON_SIZE :
                    (url.pathname === '/store/razorpay-webhook' ? 256 * 1024 : MAX_UPLOAD_SIZE));
            if (Number.isFinite(contentLength) && contentLength > limit) {
                return jsonResponse({ error: `Payload too large. Maximum size is ${Math.round(limit / 1024 / 1024)}MB.` }, 413, corsHeaders);
            }
        }

        // Razorpay webhooks are server-to-server requests and intentionally do
        // not carry a browser Origin header. Authenticate them with the
        // webhook HMAC instead of the browser-origin guard below.
        if (url.pathname === '/store/razorpay-webhook' && request.method === 'POST') {
            return handleRazorpayWebhook(request, env, allowedOrigins);
        }

        // Origin is only a CORS/defence-in-depth signal; it is never treated as
        // authentication. AI and conversion routes also require Turnstile and,
        // for conversion, a short-lived server-signed ticket.
        const ip = requestIp(request);

        if (url.pathname === '/convert/token' && request.method === 'POST') {
            const token = request.headers.get('x-turnstile-token') || request.headers.get('cf-turnstile-response');
            if (!await verifyTurnstile(token, ip, env)) {
                return jsonResponse({ error: 'Security verification failed. Please complete the verification and try again.' }, 403, corsHeaders);
            }
            const ticket = await issueConversionTicket(request, env);
            if (!ticket) return jsonResponse({ error: 'Conversion service is not configured.' }, 503, corsHeaders);
            return jsonResponse({ token: ticket, expires_in: 300 }, 200, corsHeaders);
        }

        if (CONVERSION_PATHS.has(url.pathname) && request.method === 'POST') {
            if (!await verifyConversionTicket(request, env, url.pathname)) {
                return jsonResponse({ error: 'Conversion authorization expired. Please retry the verification.' }, 403, corsHeaders);
            }
            return handleConversion(request, env, url.pathname, corsHeaders);
        }

        // AI Chat proxy (Groq — text-only LLM)
        if (url.pathname === '/ai/chat' && request.method === 'POST') {
            const turnstileToken = request.headers.get('x-turnstile-token') || request.headers.get('cf-turnstile-response');
            const isHuman = await verifyTurnstile(turnstileToken, ip, env);
            if (!isHuman) {
                return jsonResponse({ error: 'Security verification failed. Please refresh the page and try again.' }, 403, getCORSHeaders(request, allowedOrigins));
            }
            return handleGroqChat(request, env, allowedOrigins);
        }

        // AI Vision proxy (OpenRouter — multimodal)
        if (url.pathname === '/ai/vision' && request.method === 'POST') {
            const turnstileToken = request.headers.get('x-turnstile-token') || request.headers.get('cf-turnstile-response');
            const isHuman = await verifyTurnstile(turnstileToken, ip, env);
            if (!isHuman) {
                return jsonResponse({ error: 'Security verification failed. Please refresh the page and try again.' }, 403, getCORSHeaders(request, allowedOrigins));
            }
            return handleOpenRouterVision(request, env, allowedOrigins);
        }

        if (url.pathname === '/health') {
            return new Response(JSON.stringify({
                status: 'ok',
                service: 'OnlinePDFPro API Proxy',
                routes: ['/ai/chat', '/ai/vision', '/convert/token', '/convert/pdf-to-word', '/convert/word-to-pdf', '/store/create-order', '/store/verify-payment', '/store/razorpay-webhook', '/store/download', '/store/my-purchases']
            }), {
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(request, allowedOrigins) }
            });
        }

        // Store endpoints
        if (url.pathname === '/store/create-order' && request.method === 'POST') {
            return handleCreateOrder(request, env, allowedOrigins);
        }
        if (url.pathname === '/store/verify-payment' && request.method === 'POST') {
            return handleVerifyPayment(request, env, allowedOrigins);
        }
        if (url.pathname === '/store/download' && request.method === 'POST') {
            return handleDownload(request, env, allowedOrigins);
        }
        if (url.pathname === '/store/my-purchases' && request.method === 'POST') {
            return handleMyPurchases(request, env, allowedOrigins);
        }

        return jsonResponse({ error: 'Not found.' }, 404, corsHeaders);
    }
};

// ─── Utilities ────────────────────────────────────────────────────────

function jsonResponse(data, status, headers) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers }
    });
}

function getCORSHeaders(request, allowedOrigins) {
    allowedOrigins = allowedOrigins || PROD_ORIGINS;
    const origin = request.headers.get('Origin') || '';
    const headers = {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Turnstile-Token, cf-turnstile-response, X-Conversion-Token',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
    };
    if (allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
    return headers;
}

async function verifyTurnstile(token, ip, env) {
    const secret = env.TURNSTILE_SECRET_KEY;
    if (!secret || typeof token !== 'string' || token.length === 0 || token.length > 2048) return false;
    try {
        const formData = new FormData();
        formData.append('secret', secret);
        formData.append('response', token);
        if (ip && ip !== 'unknown') formData.append('remoteip', ip);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let res;
        try {
            res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
                body: formData,
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeout);
        }
        if (!res.ok) return false;
        const outcome = await res.json();
        const hostname = String(outcome.hostname || '').toLowerCase();
        const allowedHostnames = String(env.TURNSTILE_ALLOWED_HOSTNAMES || 'onlinepdfpro.com,www.onlinepdfpro.com')
            .split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
        const hostnameValid = (env.ENVIRONMENT || 'production') !== 'production' && !hostname
            ? true
            : allowedHostnames.includes(hostname);
        return outcome.success === true && hostnameValid;
    } catch (err) {
        console.error('Turnstile verification error:', err);
        return false;
    }
}

function handleCORS(request, allowedOrigins) {
    const origin = request.headers.get('Origin') || '';
    if (origin && !allowedOrigins.includes(origin)) {
        return jsonResponse({ error: 'Origin not allowed.' }, 403, getCORSHeaders(request, allowedOrigins));
    }
    return new Response(null, {
        status: 204,
        headers: getCORSHeaders(request, allowedOrigins)
    });
}

function base64UrlEncode(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
    try {
        const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
        const binary = atob(padded);
        return Uint8Array.from(binary, char => char.charCodeAt(0));
    } catch { return null; }
}

function hasPrefix(bytes, prefix) {
    if (!(bytes instanceof Uint8Array) || bytes.length < prefix.length) return false;
    return prefix.every((value, index) => bytes[index] === value);
}

function isPdfBytes(bytes) {
    return hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2D]); // %PDF-
}

function isZipBytes(bytes) {
    // DOCX and ODT are ZIP containers. Accept normal, empty, and spanned ZIP
    // signatures, but do not accept a MIME label without a container header.
    return hasPrefix(bytes, [0x50, 0x4B, 0x03, 0x04]) ||
        hasPrefix(bytes, [0x50, 0x4B, 0x05, 0x06]) ||
        hasPrefix(bytes, [0x50, 0x4B, 0x07, 0x08]);
}

function readLe16(bytes, offset) {
    return (bytes[offset] || 0) | ((bytes[offset + 1] || 0) << 8);
}

function readLe32(bytes, offset) {
    return ((bytes[offset] || 0) |
        ((bytes[offset + 1] || 0) << 8) |
        ((bytes[offset + 2] || 0) << 16) |
        ((bytes[offset + 3] || 0) << 24)) >>> 0;
}

// Read ZIP central-directory metadata without inflating untrusted entries.
// This is enough to distinguish DOCX/ODT containers from arbitrary ZIP files
// while keeping the Worker bounded for the 50 MB conversion limit.
function readZipEntries(bytes) {
    if (!isZipBytes(bytes) || bytes.length > MAX_CONVERSION_SIZE) return null;
    const start = Math.max(0, bytes.length - 65_557);
    let eocd = -1;
    for (let offset = bytes.length - 22; offset >= start; offset -= 1) {
        if (readLe32(bytes, offset) === 0x06054b50) { eocd = offset; break; }
    }
    if (eocd < 0) return null;
    const total = readLe16(bytes, eocd + 10);
    const centralSize = readLe32(bytes, eocd + 12);
    const centralOffset = readLe32(bytes, eocd + 16);
    if (!total || total > 10_000 || centralOffset + centralSize > bytes.length) return null;
    const entries = [];
    let offset = centralOffset;
    for (let index = 0; index < total; index += 1) {
        if (readLe32(bytes, offset) !== 0x02014b50) return null;
        const nameLength = readLe16(bytes, offset + 28);
        const extraLength = readLe16(bytes, offset + 30);
        const commentLength = readLe16(bytes, offset + 32);
        const end = offset + 46 + nameLength + extraLength + commentLength;
        if (end > bytes.length) return null;
        const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
        entries.push({
            name,
            method: readLe16(bytes, offset + 10),
            compressedSize: readLe32(bytes, offset + 20),
            uncompressedSize: readLe32(bytes, offset + 24),
            localOffset: readLe32(bytes, offset + 42)
        });
        offset = end;
    }
    return entries;
}

function isDocxBytes(bytes) {
    const entries = readZipEntries(bytes);
    if (!entries) return false;
    const names = new Set(entries.map(entry => entry.name));
    return names.has('[Content_Types].xml') && names.has('word/document.xml');
}

function isOdtBytes(bytes) {
    const entries = readZipEntries(bytes);
    const mimetype = entries?.find(entry => entry.name === 'mimetype');
    if (!mimetype || !entries.some(entry => entry.name === 'content.xml') || mimetype.method !== 0 || mimetype.uncompressedSize > 128) return false;
    const localOffset = mimetype.localOffset;
    if (readLe32(bytes, localOffset) !== 0x04034b50) return false;
    const nameLength = readLe16(bytes, localOffset + 26);
    const extraLength = readLe16(bytes, localOffset + 28);
    const start = localOffset + 30 + nameLength + extraLength;
    const end = start + mimetype.compressedSize;
    if (end > bytes.length) return false;
    return new TextDecoder().decode(bytes.slice(start, end)).startsWith('application/vnd.oasis.opendocument.text');
}

function isOleBytes(bytes) {
    return hasPrefix(bytes, [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
}

function isRtfBytes(bytes) {
    const sample = new TextDecoder('ascii').decode(bytes.slice(0, 64)).replace(/^\uFEFF/, '').trimStart();
    return /^\{\\rtf[0-9]/i.test(sample);
}

function isValidConversionDocument(pathname, bytes) {
    if (pathname === '/convert/pdf-to-word') return isPdfBytes(bytes);
    if (pathname === '/convert/word-to-pdf') return isDocxBytes(bytes) || isOdtBytes(bytes) || isOleBytes(bytes) || isRtfBytes(bytes);
    return false;
}

function isValidConversionOutput(pathname, bytes) {
    // Never hand a successful HTTP response to the browser merely because an
    // upstream returned 200. Validate the actual container before labelling it
    // as a DOCX or PDF download.
    return pathname === '/convert/pdf-to-word' ? isDocxBytes(bytes) : isPdfBytes(bytes);
}

async function signTicket(secret, message) {
    if (!secret) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    return base64UrlEncode(new Uint8Array(signature));
}

async function verifyTicketSignature(secret, message, signature) {
    const signatureBytes = base64UrlDecode(signature);
    if (!secret || !signatureBytes) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    return crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(message));
}

async function issueConversionTicket(request, env) {
    const secret = env.CONVERSION_SIGNING_SECRET;
    if (!secret) return null;
    const payload = {
        path: '/convert/*',
        exp: Math.floor(Date.now() / 1000) + 300,
        ip: requestIp(request)
    };
    const encoded = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
    const signature = await signTicket(secret, encoded);
    return signature ? `${encoded}.${signature}` : null;
}

async function verifyConversionTicket(request, env, pathname) {
    const token = request.headers.get('x-conversion-token') || '';
    const [encoded, signature] = token.split('.');
    const bytes = base64UrlDecode(encoded);
    if (!bytes || !signature) return false;
    try {
        const payload = JSON.parse(new TextDecoder().decode(bytes));
        if (payload.path !== '/convert/*' || payload.exp < Math.floor(Date.now() / 1000) || payload.ip !== requestIp(request)) return false;
        if (!CONVERSION_PATHS.has(pathname)) return false;
        return await verifyTicketSignature(env.CONVERSION_SIGNING_SECRET, encoded, signature);
    } catch { return false; }
}

async function handleConversion(request, env, pathname, corsHeaders) {
    const upstream = pathname === '/convert/pdf-to-word'
        ? (env.PDF_TO_WORD_URL || 'https://prem736raj--pdf2docx-convert.modal.run')
        : (env.WORD_TO_PDF_URL || 'https://prem736raj--docx2pdf-convert.modal.run');
    const production = (env.ENVIRONMENT || 'production') === 'production';
    // Modal endpoints must be protected independently. Requiring the Worker
    // secret in production prevents a silent fallback to a public conversion
    // URL; configure Modal to enforce the same bearer token as well.
    if (production && !env.MODAL_API_TOKEN) {
        console.error('[Conversion] MODAL_API_TOKEN is not configured');
        return jsonResponse({ error: 'Conversion service is temporarily unavailable.' }, 503, corsHeaders);
    }
    const contentType = request.headers.get('content-type') || 'application/octet-stream';
    if (contentType.length > 200 || !/^(application\/pdf|application\/octet-stream|application\/vnd\.|application\/msword|application\/rtf|application\/zip|text\/rtf)/i.test(contentType)) {
        return jsonResponse({ error: 'Unsupported document type.' }, 415, corsHeaders);
    }
    try {
        const body = await request.arrayBuffer();
        if (!body.byteLength || body.byteLength > MAX_CONVERSION_SIZE) return jsonResponse({ error: 'File is empty or exceeds the 50MB limit.' }, 413, corsHeaders);
        if (!isValidConversionDocument(pathname, new Uint8Array(body))) {
            return jsonResponse({ error: 'The file contents do not match a supported document format.' }, 415, corsHeaders);
        }
        const headers = { 'Content-Type': contentType, 'Accept': 'application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json' };
        if (env.MODAL_API_TOKEN) headers.Authorization = `Bearer ${env.MODAL_API_TOKEN}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);
        let response;
        try {
            response = await fetch(upstream, { method: 'POST', headers, body, signal: controller.signal });
        } finally {
            clearTimeout(timeout);
        }
        if (!response.ok) {
            const message = (await response.text()).slice(0, 1000);
            console.error('[Conversion] upstream failure', pathname, response.status, message);
            return jsonResponse({ error: 'Conversion failed. Please verify the document and try again.' }, response.status >= 500 ? 502 : 400, corsHeaders);
        }
        const output = await response.arrayBuffer();
        if (!output.byteLength || output.byteLength > 100 * 1024 * 1024) return jsonResponse({ error: 'Conversion returned an invalid or oversized file.' }, 502, corsHeaders);
        if (!isValidConversionOutput(pathname, new Uint8Array(output))) {
            console.error('[Conversion] upstream returned an invalid output signature', pathname);
            return jsonResponse({ error: 'Conversion returned an invalid document.' }, 502, corsHeaders);
        }
        const responseHeaders = new Headers(corsHeaders);
        responseHeaders.set('Content-Type', pathname.endsWith('pdf-to-word') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf');
        responseHeaders.set('Content-Disposition', 'attachment');
        responseHeaders.set('Cache-Control', 'no-store');
        responseHeaders.set('X-Content-Type-Options', 'nosniff');
        return new Response(output, { status: 200, headers: responseHeaders });
    } catch (err) {
        console.error('[Conversion] request failed', pathname, err);
        return jsonResponse({ error: 'Conversion service is temporarily unavailable.' }, 502, corsHeaders);
    }
}

// ─── Supabase Helper ──────────────────────────────────────────────────

async function supabaseQuery(env, path, method, body, token, extraHeaders = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${token || env.SUPABASE_SERVICE_ROLE_KEY}`,
        ...extraHeaders
    };
    const opts = { method, headers };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    opts.signal = controller.signal;
    try {
        const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, opts);
        const text = await res.text();
        try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
        catch { return { ok: res.ok, status: res.status, data: text }; }
    } finally {
        clearTimeout(timeout);
    }
}

function isValidProductId(productId) {
    return typeof productId === 'string' &&
        productId.length > 0 &&
        productId.length <= 100 &&
        /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(productId);
}

function isValidRazorpayId(value, prefix) {
    return typeof value === 'string' &&
        value.length <= 100 &&
        new RegExp(`^${prefix}_[A-Za-z0-9_-]+$`).test(value);
}

function integerAmount(value) {
    const amount = Number(value);
    return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

function hexToBytes(hex) {
    if (typeof hex !== 'string' || !/^[0-9a-f]{64}$/i.test(hex)) return null;
    const bytes = new Uint8Array(hex.length / 2);
    for (let index = 0; index < bytes.length; index++) {
        bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
    }
    return bytes;
}

async function verifyHmacHex(secret, message, signature) {
    const signatureBytes = hexToBytes(signature);
    if (!secret || !signatureBytes) return false;

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );

    return crypto.subtle.verify(
        'HMAC',
        key,
        signatureBytes,
        new TextEncoder().encode(message)
    );
}

function razorpayAuthHeader(env) {
    return `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`;
}

async function razorpayRequest(env, path, method = 'GET', body) {
    const headers = {
        'Authorization': razorpayAuthHeader(env),
        'Content-Type': 'application/json'
    };
    const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {})
    });
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    return { ok: response.ok, status: response.status, data };
}

async function getProduct(env, productId) {
    return supabaseQuery(
        env,
        `products?id=eq.${encodeURIComponent(productId)}&select=id,price_inr,title,status,r2_key`,
        'GET'
    );
}

async function getOrderByRazorpayId(env, razorpayOrderId) {
    const result = await supabaseQuery(
        env,
        `orders?razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}&select=id,user_id,product_id,amount_inr,status,razorpay_payment_id,razorpay_signature&limit=1`,
        'GET'
    );
    return result;
}

function safeDownloadFilename(r2Key) {
    const basename = String(r2Key || '').split('/').pop() || 'download.pdf';
    const safe = basename
        .normalize('NFKC')
        .replace(/[\u0000-\u001F\u007F"\\]/g, '_')
        .replace(/[^A-Za-z0-9._() -]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120);
    const filename = safe || 'download.pdf';
    return /\.pdf$/i.test(filename) ? filename : `${filename}.pdf`;
}

// Verify a Supabase JWT and extract the user_id
async function verifySupabaseJWT(env, authHeader) {
    const match = typeof authHeader === 'string'
        ? /^Bearer\s+([A-Za-z0-9._~-]{20,4096})$/.exec(authHeader.trim())
        : null;
    if (!match || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
    const token = match[1];
    // Use Supabase's auth endpoint to verify the signed token server-side.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': env.SUPABASE_SERVICE_ROLE_KEY
            },
            signal: controller.signal
        });
        if (!res.ok) return null;
        const user = await res.json();
        return typeof user?.id === 'string' && user.id.length <= 100 ? user.id : null;
    } catch (err) {
        console.error('[Store] Supabase JWT verification failed', err);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

// ─── Store: Razorpay Payments ──────────────────────────────────────────

async function handleCreateOrder(request, env, allowedOrigins) {
    const corsHeaders = getCORSHeaders(request, allowedOrigins);
    try {
        if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[Store] create-order is missing server configuration');
            return jsonResponse({ error: 'Checkout is temporarily unavailable.' }, 503, corsHeaders);
        }

        // Verify user is logged in
        const userId = await verifySupabaseJWT(env, request.headers.get('Authorization'));
        if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);

        let body;
        try {
            body = await request.json();
        } catch (err) {
            return jsonResponse({ error: 'Invalid request.' }, 400, corsHeaders);
        }
        const { product_id } = body || {};
        if (!isValidProductId(product_id)) {
            return jsonResponse({ error: 'A valid product is required.' }, 400, corsHeaders);
        }

        // Product, price, and user identity all come from trusted server-side
        // state. The browser only supplies a product lookup key.
        const productRes = await getProduct(env, product_id);
        if (!productRes.ok) {
            console.error('[Store] product lookup failed during create-order', productRes.status, productRes.data);
            return jsonResponse({ error: 'Checkout is temporarily unavailable.' }, 503, corsHeaders);
        }
        if (!Array.isArray(productRes.data) || !productRes.data.length || productRes.data[0].status !== 'active') {
            return jsonResponse({ error: 'Product not found' }, 404, corsHeaders);
        }
        const product = productRes.data[0];
        const amount = integerAmount(product.price_inr);
        if (!amount) {
            console.error('[Store] product has invalid price', product.id, product.price_inr);
            return jsonResponse({ error: 'Checkout is temporarily unavailable.' }, 503, corsHeaders);
        }

        // A paid entitlement is permanent for this product. Check before
        // creating another Razorpay order so duplicate purchases are blocked.
        const paidOrderRes = await supabaseQuery(
            env,
            `orders?user_id=eq.${encodeURIComponent(userId)}&product_id=eq.${encodeURIComponent(product.id)}&status=eq.paid&select=id&limit=1`,
            'GET'
        );
        if (!paidOrderRes.ok) {
            console.error('[Store] paid-entitlement lookup failed during create-order', paidOrderRes.status, paidOrderRes.data);
            return jsonResponse({ error: 'Checkout is temporarily unavailable.' }, 503, corsHeaders);
        }
        if (Array.isArray(paidOrderRes.data) && paidOrderRes.data.length) {
            return jsonResponse({
                code: 'ALREADY_PURCHASED',
                error: 'You already own this item. Open My Library.',
                library_url: '/library.html'
            }, 409, corsHeaders);
        }

        // Create Razorpay Order
        const rzpResult = await razorpayRequest(env, 'orders', 'POST', { amount, currency: 'INR' });
        if (!rzpResult.ok || !rzpResult.data?.id || integerAmount(rzpResult.data.amount) !== amount || rzpResult.data.currency !== 'INR') {
            console.error('[Store] Razorpay order creation failed', rzpResult.status, rzpResult.data);
            return jsonResponse({ error: 'Checkout is temporarily unavailable.' }, 503, corsHeaders);
        }
        const rzpOrder = rzpResult.data;

        // Save order to Supabase with status 'created'
        const insertRes = await supabaseQuery(env, 'orders', 'POST', {
            user_id: userId,
            product_id: product.id,
            razorpay_order_id: rzpOrder.id,
            amount_inr: amount,
            status: 'created'
        });
        if (!insertRes.ok) {
            console.error('[Store] order persistence failed after Razorpay order creation', insertRes.status, insertRes.data, rzpOrder.id);
            return jsonResponse({ error: 'Checkout is temporarily unavailable. Please try again.' }, 503, corsHeaders);
        }
        
        return jsonResponse({
            order_id: rzpOrder.id,
            amount,
            currency: rzpOrder.currency,
            key: env.RAZORPAY_KEY_ID  // Send the key to frontend so it doesn't need to be hardcoded
        }, 200, corsHeaders);

    } catch (err) {
        console.error('[Store] create-order failed', err);
        return jsonResponse({ error: 'Checkout is temporarily unavailable.' }, 503, corsHeaders);
    }
}

async function handleVerifyPayment(request, env, allowedOrigins) {
    const corsHeaders = getCORSHeaders(request, allowedOrigins);
    try {
        if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[Store] verify-payment is missing server configuration');
            return jsonResponse({ error: 'Payment verification is temporarily unavailable.' }, 503, corsHeaders);
        }

        const userId = await verifySupabaseJWT(env, request.headers.get('Authorization'));
        if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);

        let body;
        try {
            body = await request.json();
        } catch (err) {
            return jsonResponse({ error: 'Invalid request.' }, 400, corsHeaders);
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};
        
        if (!isValidRazorpayId(razorpay_order_id, 'order') ||
            !isValidRazorpayId(razorpay_payment_id, 'pay') ||
            !hexToBytes(razorpay_signature)) {
            return jsonResponse({ error: 'Invalid payment details.' }, 400, corsHeaders);
        }

        if (!await verifyHmacHex(env.RAZORPAY_KEY_SECRET, `${razorpay_order_id}|${razorpay_payment_id}`, razorpay_signature)) {
            return jsonResponse({ error: 'Invalid payment signature.' }, 400, corsHeaders);
        }

        const orderRes = await getOrderByRazorpayId(env, razorpay_order_id);
        if (!orderRes.ok) {
            console.error('[Store] order lookup failed during verify-payment', orderRes.status, orderRes.data);
            return jsonResponse({ error: 'Payment verification is temporarily unavailable.' }, 503, corsHeaders);
        }
        if (!Array.isArray(orderRes.data) || !orderRes.data.length) {
            return jsonResponse({ error: 'Payment order not found.' }, 404, corsHeaders);
        }
        const order = orderRes.data[0];

        if (order.user_id !== userId) {
            return jsonResponse({ error: 'Payment order does not belong to this account.' }, 403, corsHeaders);
        }

        const productRes = await getProduct(env, order.product_id);
        if (!productRes.ok) {
            console.error('[Store] product lookup failed during verify-payment', productRes.status, productRes.data);
            return jsonResponse({ error: 'Payment verification is temporarily unavailable.' }, 503, corsHeaders);
        }
        if (!Array.isArray(productRes.data) || !productRes.data.length) {
            return jsonResponse({ error: 'Product not found.' }, 404, corsHeaders);
        }
        const product = productRes.data[0];
        const expectedAmount = integerAmount(order.amount_inr);
        if (!expectedAmount || integerAmount(product.price_inr) !== expectedAmount) {
            console.error('[Store] product/order amount mismatch during verify-payment', {
                orderId: order.id,
                productId: order.product_id,
                orderAmount: order.amount_inr,
                productAmount: product.price_inr
            });
            return jsonResponse({ error: 'Payment amount could not be verified.' }, 400, corsHeaders);
        }

        // A paid order is safe to return repeatedly only for the same payment.
        // The conditional update below also makes webhook/callback races safe.
        if (order.status === 'paid') {
            if (order.razorpay_payment_id && order.razorpay_payment_id !== razorpay_payment_id) {
                return jsonResponse({ error: 'Payment order is already fulfilled.' }, 409, corsHeaders);
            }
            return jsonResponse({ success: true, already_processed: true, message: 'Payment already verified.' }, 200, corsHeaders);
        }
        if (order.status !== 'created') {
            return jsonResponse({ error: 'Payment order is not payable.' }, 409, corsHeaders);
        }

        // Verify the server-side Razorpay order and payment objects. This
        // prevents a valid HMAC for the wrong order/amount from granting access.
        const rzpOrderRes = await razorpayRequest(env, `orders/${encodeURIComponent(razorpay_order_id)}`);
        if (!rzpOrderRes.ok) {
            console.error('[Store] Razorpay order lookup failed during verify-payment', rzpOrderRes.status, rzpOrderRes.data);
            return jsonResponse({ error: 'Payment is not yet confirmed by Razorpay.' }, 502, corsHeaders);
        }
        const rzpOrder = rzpOrderRes.data;
        if (rzpOrder.id !== razorpay_order_id ||
            integerAmount(rzpOrder.amount) !== expectedAmount ||
            rzpOrder.currency !== 'INR') {
            console.error('[Store] Razorpay order mismatch during verify-payment', rzpOrder);
            return jsonResponse({ error: 'Payment amount could not be verified.' }, 400, corsHeaders);
        }

        const rzpPaymentRes = await razorpayRequest(env, `payments/${encodeURIComponent(razorpay_payment_id)}`);
        if (!rzpPaymentRes.ok) {
            console.error('[Store] Razorpay payment lookup failed during verify-payment', rzpPaymentRes.status, rzpPaymentRes.data);
            return jsonResponse({ error: 'Payment is not yet confirmed by Razorpay.' }, 502, corsHeaders);
        }
        const rzpPayment = rzpPaymentRes.data;
        if (rzpPayment.id !== razorpay_payment_id ||
            rzpPayment.order_id !== razorpay_order_id ||
            integerAmount(rzpPayment.amount) !== expectedAmount ||
            rzpPayment.currency !== 'INR' ||
            rzpPayment.status !== 'captured') {
            console.error('[Store] Razorpay payment mismatch or not captured during verify-payment', rzpPayment);
            return jsonResponse({ error: 'Payment is not captured.' }, 400, corsHeaders);
        }

        const updateRes = await supabaseQuery(env,
            `orders?razorpay_order_id=eq.${encodeURIComponent(razorpay_order_id)}&user_id=eq.${encodeURIComponent(userId)}&status=eq.created`,
            'PATCH', 
            {
                razorpay_payment_id,
                razorpay_signature,
                status: 'paid'
            },
            undefined,
            { 'Prefer': 'return=representation' }
        );
        if (!updateRes.ok) {
            console.error('[Store] order update failed during verify-payment', updateRes.status, updateRes.data);
            if (updateRes.status === 409) {
                const paidEntitlementRes = await supabaseQuery(
                    env,
                    `orders?user_id=eq.${encodeURIComponent(userId)}&product_id=eq.${encodeURIComponent(order.product_id)}&status=eq.paid&select=id&limit=1`,
                    'GET'
                );
                if (paidEntitlementRes.ok && Array.isArray(paidEntitlementRes.data) && paidEntitlementRes.data.length) {
                    return jsonResponse({
                        code: 'ALREADY_PURCHASED',
                        error: 'You already own this item. Open My Library.',
                        library_url: '/library.html'
                    }, 409, corsHeaders);
                }
            }
            return jsonResponse({ error: 'Payment received, but access is not ready yet. Please try again shortly.' }, 503, corsHeaders);
        }

        if (!Array.isArray(updateRes.data) || !updateRes.data.length) {
            const retryOrderRes = await getOrderByRazorpayId(env, razorpay_order_id);
            if (retryOrderRes.ok && Array.isArray(retryOrderRes.data) && retryOrderRes.data[0]?.status === 'paid') {
                return jsonResponse({ success: true, already_processed: true, message: 'Payment already verified.' }, 200, corsHeaders);
            }
            console.error('[Store] order update affected no rows during verify-payment', updateRes.data);
            return jsonResponse({ error: 'Payment received, but access is not ready yet. Please try again shortly.' }, 503, corsHeaders);
        }

        return jsonResponse({ success: true, product_id: order.product_id, message: 'Payment verified.' }, 200, corsHeaders);

    } catch (err) {
        console.error('[Store] verify-payment failed', err);
        return jsonResponse({ error: 'Payment verification is temporarily unavailable.' }, 503, corsHeaders);
    }
}

async function handleRazorpayWebhook(request, env, allowedOrigins) {
    const corsHeaders = getCORSHeaders(request, allowedOrigins);
    try {
        if (!env.RAZORPAY_WEBHOOK_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[Store] razorpay-webhook is missing server configuration');
            return jsonResponse({ error: 'Webhook is temporarily unavailable.' }, 503, corsHeaders);
        }

        const signature = request.headers.get('X-Razorpay-Signature') || '';
        const rawBody = await request.text();
        if (rawBody.length > 256 * 1024) {
            return jsonResponse({ error: 'Webhook payload too large.' }, 413, corsHeaders);
        }
        if (!await verifyHmacHex(env.RAZORPAY_WEBHOOK_SECRET, rawBody, signature)) {
            return jsonResponse({ error: 'Invalid webhook signature.' }, 400, corsHeaders);
        }

        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (err) {
            return jsonResponse({ error: 'Invalid webhook payload.' }, 400, corsHeaders);
        }

        const event = body?.event;
        if (event !== 'payment.captured' && event !== 'order.paid') {
            return jsonResponse({ received: true, ignored: true }, 200, corsHeaders);
        }

        const payment = body?.payload?.payment?.entity;
        const rzpOrder = body?.payload?.order?.entity;
        const razorpayOrderId = payment?.order_id || rzpOrder?.id;
        const razorpayPaymentId = payment?.id || null;
        const eventAmount = integerAmount(payment?.amount ?? rzpOrder?.amount_paid ?? rzpOrder?.amount);
        const eventCurrency = payment?.currency || rzpOrder?.currency;

        if (!isValidRazorpayId(razorpayOrderId, 'order') ||
            (razorpayPaymentId && !isValidRazorpayId(razorpayPaymentId, 'pay')) ||
            !eventAmount || eventCurrency !== 'INR' ||
            (event === 'payment.captured' && payment?.status !== 'captured') ||
            (event === 'order.paid' && rzpOrder?.status && rzpOrder.status !== 'paid')) {
            return jsonResponse({ error: 'Invalid webhook payload.' }, 400, corsHeaders);
        }

        const orderRes = await getOrderByRazorpayId(env, razorpayOrderId);
        if (!orderRes.ok) {
            console.error('[Store] order lookup failed during razorpay-webhook', orderRes.status, orderRes.data);
            return jsonResponse({ error: 'Webhook processing is temporarily unavailable.' }, 503, corsHeaders);
        }
        if (!Array.isArray(orderRes.data) || !orderRes.data.length) {
            // The event is authenticated but does not belong to this store.
            // Acknowledge it to avoid endless provider retries.
            console.warn('[Store] ignoring webhook for unknown Razorpay order', razorpayOrderId);
            return jsonResponse({ received: true, ignored: true }, 200, corsHeaders);
        }
        const order = orderRes.data[0];

        if (integerAmount(order.amount_inr) !== eventAmount) {
            console.error('[Store] webhook amount mismatch', {
                razorpayOrderId,
                expected: order.amount_inr,
                received: eventAmount
            });
            return jsonResponse({ error: 'Webhook amount could not be verified.' }, 400, corsHeaders);
        }

        if (order.status === 'paid') {
            if (razorpayPaymentId && order.razorpay_payment_id && order.razorpay_payment_id !== razorpayPaymentId) {
                console.warn('[Store] duplicate webhook has a different payment id', razorpayOrderId);
            }
            return jsonResponse({ received: true, processed: true, already_processed: true }, 200, corsHeaders);
        }
        if (order.status !== 'created') {
            return jsonResponse({ received: true, ignored: true }, 200, corsHeaders);
        }

        const productRes = await getProduct(env, order.product_id);
        if (!productRes.ok || !Array.isArray(productRes.data) || !productRes.data.length) {
            console.error('[Store] product lookup failed during razorpay-webhook', productRes.status, productRes.data);
            return jsonResponse({ error: 'Webhook processing is temporarily unavailable.' }, 503, corsHeaders);
        }
        if (integerAmount(productRes.data[0].price_inr) !== integerAmount(order.amount_inr)) {
            console.error('[Store] product/order amount mismatch during razorpay-webhook', order, productRes.data[0]);
            return jsonResponse({ error: 'Webhook amount could not be verified.' }, 400, corsHeaders);
        }

        // Only update a still-created order. A repeated webhook, or a race
        // with the browser callback, therefore cannot create a second grant.
        const updateRes = await supabaseQuery(
            env,
            `orders?razorpay_order_id=eq.${encodeURIComponent(razorpayOrderId)}&status=eq.created`,
            'PATCH',
            {
                ...(razorpayPaymentId ? { razorpay_payment_id: razorpayPaymentId } : {}),
                status: 'paid'
            },
            undefined,
            { 'Prefer': 'return=representation' }
        );
        if (!updateRes.ok) {
            console.error('[Store] order update failed during razorpay-webhook', updateRes.status, updateRes.data);
            if (updateRes.status === 409) {
                const paidEntitlementRes = await supabaseQuery(
                    env,
                    `orders?user_id=eq.${encodeURIComponent(order.user_id)}&product_id=eq.${encodeURIComponent(order.product_id)}&status=eq.paid&select=id&limit=1`,
                    'GET'
                );
                if (paidEntitlementRes.ok && Array.isArray(paidEntitlementRes.data) && paidEntitlementRes.data.length) {
                    return jsonResponse({ received: true, ignored: true, reason: 'already_fulfilled' }, 200, corsHeaders);
                }
            }
            return jsonResponse({ error: 'Webhook processing is temporarily unavailable.' }, 503, corsHeaders);
        }

        if (!Array.isArray(updateRes.data) || !updateRes.data.length) {
            const retryOrderRes = await getOrderByRazorpayId(env, razorpayOrderId);
            if (retryOrderRes.ok && Array.isArray(retryOrderRes.data) && retryOrderRes.data[0]?.status === 'paid') {
                return jsonResponse({ received: true, processed: true, already_processed: true }, 200, corsHeaders);
            }
            console.error('[Store] webhook update affected no rows', updateRes.data);
            return jsonResponse({ error: 'Webhook processing is temporarily unavailable.' }, 503, corsHeaders);
        }

        return jsonResponse({ received: true, processed: true }, 200, corsHeaders);
    } catch (err) {
        console.error('[Store] razorpay-webhook failed', err);
        return jsonResponse({ error: 'Webhook processing is temporarily unavailable.' }, 503, corsHeaders);
    }
}

// ─── Store: Secure Download from R2 ───────────────────────────────────

async function handleDownload(request, env, allowedOrigins) {
    const corsHeaders = getCORSHeaders(request, allowedOrigins);
    try {
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.PRODUCTS_BUCKET) {
            console.error('[Store] download is missing server configuration');
            return jsonResponse({ error: 'Download is temporarily unavailable.' }, 503, corsHeaders);
        }
        const userId = await verifySupabaseJWT(env, request.headers.get('Authorization'));
        if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);

        let body;
        try {
            body = await request.json();
        } catch (err) {
            return jsonResponse({ error: 'Invalid request.' }, 400, corsHeaders);
        }
        const { product_id } = body || {};
        if (!isValidProductId(product_id)) {
            return jsonResponse({ error: 'A valid product is required.' }, 400, corsHeaders);
        }

        // Resolve the product before checking entitlement so unknown IDs do
        // not look like valid products that the user simply has not bought.
        const productRes = await getProduct(env, product_id);
        if (!productRes.ok) {
            console.error('[Store] product lookup failed during download', productRes.status, productRes.data);
            return jsonResponse({ error: 'Download is temporarily unavailable.' }, 503, corsHeaders);
        }
        if (!Array.isArray(productRes.data) || !productRes.data.length || !productRes.data[0].r2_key) {
            return jsonResponse({ error: 'Product not found.' }, 404, corsHeaders);
        }
        const product = productRes.data[0];

        // Check if user has purchased this product
        const orderRes = await supabaseQuery(env,
            `orders?user_id=eq.${encodeURIComponent(userId)}&product_id=eq.${encodeURIComponent(product.id)}&status=eq.paid&select=id&limit=1`,
            'GET'
        );
        if (!orderRes.ok) {
            console.error('[Store] entitlement lookup failed during download', orderRes.status, orderRes.data);
            return jsonResponse({ error: 'Download is temporarily unavailable.' }, 503, corsHeaders);
        }
        if (!Array.isArray(orderRes.data) || !orderRes.data.length) {
            return jsonResponse({ error: 'You have not purchased this product' }, 403, corsHeaders);
        }

        // r2_key comes only from the server-side product record. It is never
        // accepted from the browser request.
        const r2Key = product.r2_key;

        // Fetch file from R2
        const object = await env.PRODUCTS_BUCKET.get(r2Key);
        if (!object) {
            console.error('[Store] entitled product is missing from R2', product.id, r2Key);
            return jsonResponse({ error: 'Download file is temporarily unavailable.' }, 404, corsHeaders);
        }

        // Stream the PDF to the user
        const filename = safeDownloadFilename(r2Key);
        return new Response(object.body, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
                'Cache-Control': 'private, no-store',
                'X-Content-Type-Options': 'nosniff'
            }
        });

    } catch (err) {
        console.error('[Store] download failed', err);
        return jsonResponse({ error: 'Download is temporarily unavailable.' }, 503, corsHeaders);
    }
}

// ─── Store: My Purchases ──────────────────────────────────────────────

async function handleMyPurchases(request, env, allowedOrigins) {
    const corsHeaders = getCORSHeaders(request, allowedOrigins);
    try {
        const userId = await verifySupabaseJWT(env, request.headers.get('Authorization'));
        if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);

        // Fetch all paid orders for this user, joined with product info
        const res = await supabaseQuery(env,
            `orders?user_id=eq.${encodeURIComponent(userId)}&status=eq.paid&select=id,product_id,amount_inr,created_at,products(id,title,description)`,
            'GET'
        );

        if (!res.ok) {
            console.error('[Store] purchase lookup failed', res.status, res.data);
            return jsonResponse({ error: 'Could not load your purchases.' }, 503, corsHeaders);
        }

        return jsonResponse({ purchases: res.data || [] }, 200, corsHeaders);

    } catch (err) {
        console.error('[Store] my-purchases failed', err);
        return jsonResponse({ error: 'Could not load your purchases.' }, 503, corsHeaders);
    }
}

async function readJsonRequest(request, maxBytes = MAX_JSON_SIZE) {
    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
        return { error: 'Request is too large.' };
    }
    try {
        const text = await request.text();
        if (new TextEncoder().encode(text).byteLength > maxBytes) return { error: 'Request is too large.' };
        const data = JSON.parse(text);
        return { data };
    } catch {
        return { error: 'Invalid request body.' };
    }
}

function validateAIRequest(body) {
    if (!body || typeof body !== 'object' || !Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_AI_MESSAGES) {
        return { error: 'messages must be a non-empty array with at most 40 items.' };
    }
    let totalTextChars = 0;
    let totalImageChars = 0;
    let imageCount = 0;
    const messages = [];
    for (const message of body.messages) {
        if (!message || !['system', 'user', 'assistant'].includes(message.role)) return { error: 'Each message must have a valid role.' };
        const content = message.content;
        if (typeof content === 'string') {
            if (content.length > MAX_AI_MESSAGE_CHARS) return { error: 'Message content is too large.' };
            totalTextChars += content.length;
            messages.push({ role: message.role, content });
        } else if (Array.isArray(content)) {
            const parts = [];
            for (const part of content) {
                if (!part || typeof part !== 'object' || !['text', 'image_url'].includes(part.type)) return { error: 'Unsupported message content.' };
                if (part.type === 'text') {
                    if (typeof part.text !== 'string' || part.text.length > MAX_AI_MESSAGE_CHARS) return { error: 'Message content is too large.' };
                    totalTextChars += part.text.length;
                    parts.push({ type: 'text', text: part.text });
                } else {
                    const imageUrl = part.image_url && typeof part.image_url.url === 'string' ? part.image_url.url : '';
                    imageCount += 1;
                    if (imageCount > 5 || !imageUrl || imageUrl.length > 12 * 1024 * 1024 || !/^(?:https?:\/\/|data:image\/)/i.test(imageUrl)) return { error: 'Unsupported image input.' };
                    totalImageChars += imageUrl.length;
                    parts.push({ type: 'image_url', image_url: { url: imageUrl } });
                }
            }
            messages.push({ role: message.role, content: parts });
        } else {
            return { error: 'Message content must be text or structured content.' };
        }
    }
    if (totalTextChars > MAX_AI_MESSAGE_CHARS || totalImageChars > MAX_AI_IMAGE_CHARS) return { error: 'Request content is too large.' };
    const model = typeof body.model === 'string' && /^[A-Za-z0-9._:/-]{1,100}$/.test(body.model) ? body.model : undefined;
    const maxTokens = Number(body.max_tokens);
    const temperature = Number(body.temperature);
    const options = {
        messages,
        model,
        max_tokens: Number.isFinite(maxTokens) ? Math.max(1, Math.min(Math.floor(maxTokens), 8192)) : 4096,
        temperature: Number.isFinite(temperature) ? Math.max(0, Math.min(temperature, 2)) : 0.7
    };
    if (body.response_format && typeof body.response_format === 'object' && body.response_format.type === 'json_object') {
        options.response_format = { type: 'json_object' };
    }
    return { data: options };
}

async function fetchJsonUpstream(url, options, timeoutMs = 60_000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { error: { message: 'Invalid upstream response.' } }; }
        return { ok: response.ok, status: response.status, data };
    } finally {
        clearTimeout(timeout);
    }
}

// ─── AI Proxy: Groq (text chat/summarize/flashcards) ──────────────────

async function handleGroqChat(request, env, allowedOrigins) {
    const corsHeaders = getCORSHeaders(request, allowedOrigins);

    try {
        const parsed = await readJsonRequest(request);
        if (parsed.error) return jsonResponse({ error: parsed.error }, 400, corsHeaders);
        const validated = validateAIRequest(parsed.data);
        if (validated.error) return jsonResponse({ error: validated.error }, 400, corsHeaders);
        const body = validated.data;

        // Try Groq first if key is available
        if (env.GROQ_API_KEY) {
            const groqResponse = await fetchJsonUpstream('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: body.model || 'openai/gpt-oss-20b',
                    messages: body.messages,
                    max_tokens: body.max_tokens,
                    temperature: body.temperature,
                    ...(body.response_format ? { response_format: body.response_format } : {})
                })
            });

            // If Groq succeeds, return the response directly.
            if (groqResponse.ok) {
                return jsonResponse(groqResponse.data, groqResponse.status, corsHeaders);
            }
            // Any Groq error (rate limit, model deprecated, token limit, etc.) → fall through to OpenRouter
            console.warn('[Proxy] Groq failed (' + groqResponse.status + '), falling back to OpenRouter');
        }

        // Fallback: route through OpenRouter (same as /ai/vision handler)
        if (!env.OPENROUTER_API_KEY) {
            return jsonResponse({ error: 'No AI backend available. Both GROQ_API_KEY and OPENROUTER_API_KEY are missing.' }, 500, corsHeaders);
        }

        const orResponse = await fetchJsonUpstream('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://onlinepdfpro.com',
                'X-Title': 'OnlinePDFPro'
            },
            body: JSON.stringify({
                model: 'openrouter/free',
                messages: body.messages,
                max_tokens: body.max_tokens,
                temperature: body.temperature
            })
        });
        return jsonResponse(orResponse.data, orResponse.status, corsHeaders);

    } catch (err) {
        console.error('[Proxy] Groq/OpenRouter request failed', err);
        return jsonResponse({ error: 'AI service is temporarily unavailable.' }, 502, corsHeaders);
    }
}

// ─── AI Proxy: OpenRouter (vision/multimodal) ─────────────────────────

async function handleOpenRouterVision(request, env, allowedOrigins) {
    const corsHeaders = getCORSHeaders(request, allowedOrigins);

    if (!env.OPENROUTER_API_KEY) {
        return jsonResponse({ error: 'OPENROUTER_API_KEY not configured' }, 500, corsHeaders);
    }

    try {
        const parsed = await readJsonRequest(request, MAX_VISION_JSON_SIZE);
        if (parsed.error) return jsonResponse({ error: parsed.error }, 400, corsHeaders);
        const validated = validateAIRequest(parsed.data);
        if (validated.error) return jsonResponse({ error: validated.error }, 400, corsHeaders);
        const body = validated.data;

        const requestedModel = body.model || 'openrouter/free';

        // Forward to OpenRouter with server-side key
        const orResponse = await fetchJsonUpstream('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://onlinepdfpro.com',
                'X-Title': 'OnlinePDFPro'
            },
            body: JSON.stringify({
                model: requestedModel,
                messages: body.messages,
                max_tokens: body.max_tokens
            })
        });

        // If the requested model is rate-limited/unavailable, auto-fallback
        if (!orResponse.ok && requestedModel !== 'openrouter/free' && (orResponse.status === 429 || orResponse.status === 503)) {
            console.warn(`[Proxy] Model ${requestedModel} unavailable (${orResponse.status}), retrying with openrouter/free`);
            const fallbackResponse = await fetchJsonUpstream('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://onlinepdfpro.com',
                    'X-Title': 'OnlinePDFPro'
                },
                body: JSON.stringify({
                    model: 'openrouter/free',
                    messages: body.messages,
                    max_tokens: body.max_tokens
                })
            });
            return jsonResponse(fallbackResponse.data, fallbackResponse.status, corsHeaders);
        }

        return jsonResponse(orResponse.data, orResponse.status, corsHeaders);

    } catch (err) {
        console.error('[Proxy] Vision request failed', err);
        return jsonResponse({ error: 'AI service is temporarily unavailable.' }, 502, corsHeaders);
    }
}
