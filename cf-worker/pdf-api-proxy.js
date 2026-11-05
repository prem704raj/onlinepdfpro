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
    '/ai/chat', '/ai/vision', '/convert/token', ...CONVERSION_PATHS
]);

const ALLOWED_CHAT_MODELS = new Set([
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
]);

const ALLOWED_VISION_MODELS = new Set([
    'openrouter/free',
    'google/gemma-4-31b-it:free',
    'openai/gpt-4o-mini',
    'anthropic/claude-3.5-haiku',
    'meta-llama/llama-3.2-11b-vision-instruct:free'
]);

// Browser POSTs send an Origin header from an allowed domain. Requests without
// an Origin are still handled for health checks, server webhooks, and clients
// that do not expose the header; the value is defence-in-depth only and never
// substitutes for Turnstile, signed tickets, JWTs, or HMAC verification.
function getAllowedOrigins(env) {
    const isProd = (env.ENVIRONMENT || 'production') === 'production';
    return isProd ? PROD_ORIGINS : [...PROD_ORIGINS, ...DEV_ORIGINS];
}

function requestIp(request) {
    return request.headers.get('cf-connecting-ip') || 'unknown';
}

function rateLimiterFor(env, pathname) {
    // Costly routes must never silently fall back to the generic bucket. A
    // missing route-specific binding is a deployment/configuration error in
    // production; using the generic limiter would make the protection weaker
    // while still appearing healthy.
    if (pathname === '/ai/chat') return env.AI_CHAT_LIMITER;
    if (pathname === '/ai/vision') return env.AI_VISION_LIMITER;
    if (CONVERSION_PATHS.has(pathname) || pathname === '/convert/token') {
        return env.CONVERSION_LIMITER;
    }
    return env.API_RATE_LIMITER;
}

async function enforceRateLimit(request, env, pathname) {
    // Cloudflare's bindings are backed by distributed state. Missing production
    // configuration is a deployment error, not a reason to silently fall back
    // to an in-memory map that disappears between Worker isolates.
    const limiter = rateLimiterFor(env, pathname);
    if (!limiter || typeof limiter.limit !== 'function') {
        const production = (env.ENVIRONMENT || 'production') === 'production';
        return { allowed: !production, unavailable: production };
    }
    try {
        const key = `${requestIp(request)}:${pathname}`;
        const result = await limiter.limit({ key });
        return { allowed: result?.success === true, unavailable: false };
    } catch (err) {
        console.error('[RateLimit] binding failed', pathname, err);
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
                (url.pathname === '/ai/vision' ? MAX_VISION_JSON_SIZE : MAX_UPLOAD_SIZE);
            if (Number.isFinite(contentLength) && contentLength > limit) {
                return jsonResponse({ error: `Payload too large. Maximum size is ${Math.round(limit / 1024 / 1024)}MB.` }, 413, corsHeaders);
            }
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
            let targetPath = '';
            const contentType = request.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try {
                    const parsed = await readJsonRequest(request);
                    if (parsed.error) return jsonResponse({ error: parsed.error }, 400, corsHeaders);
                    if (typeof parsed.data?.target === 'string') targetPath = parsed.data.target;
                } catch {}
            }
            if (!targetPath) {
                targetPath = url.searchParams.get('target') || request.headers.get('x-target-path') || '';
            }
            if (!targetPath || !CONVERSION_PATHS.has(targetPath)) {
                return jsonResponse({ error: 'A valid conversion target route is required (/convert/pdf-to-word or /convert/word-to-pdf).' }, 400, corsHeaders);
            }
            const ticket = await issueConversionTicket(request, env, targetPath);
            if (!ticket) return jsonResponse({ error: 'Conversion service is not configured.' }, 503, corsHeaders);
            return jsonResponse({ token: ticket, expires_in: 300, target: targetPath }, 200, corsHeaders);
        }

        if (CONVERSION_PATHS.has(url.pathname) && request.method === 'POST') {
            if (!await verifyConversionTicket(request, env, url.pathname)) {
                return jsonResponse({ error: 'Conversion authorization expired or invalid for this route. Please retry the verification.' }, 403, corsHeaders);
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
                version: '1.0.0',
                // The deploy pipeline injects the commit SHA. Never keep a
                // hard-coded historical release here: a stale value makes a
                // healthy-but-old Worker indistinguishable from the current
                // deployment.
                release: env.RELEASE_ID || 'local',
                routes: ['/ai/chat', '/ai/vision', '/convert/token', '/convert/pdf-to-word', '/convert/word-to-pdf']
            }), {
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(request, allowedOrigins) }
            });
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
        try {
            const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
                body: formData,
                signal: controller.signal
            });
        if (!res.ok) return false;
        const outcome = JSON.parse(new TextDecoder().decode(await readBoundedBytes(res, MAX_JSON_SIZE, { signal: controller.signal })));
        const hostname = String(outcome.hostname || '').toLowerCase();
        const allowedHostnames = String(env.TURNSTILE_ALLOWED_HOSTNAMES || 'onlinepdfpro.com,www.onlinepdfpro.com')
            .split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
        const hostnameValid = (env.ENVIRONMENT || 'production') !== 'production' && !hostname
            ? true
            : allowedHostnames.includes(hostname);
        return outcome.success === true && hostnameValid;
        } finally { clearTimeout(timeout); }
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

async function issueConversionTicket(request, env, targetPath) {
    const secret = env.CONVERSION_SIGNING_SECRET;
    if (!secret || !targetPath) return null;
    const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
    const payload = {
        path: targetPath,
        exp: Math.floor(Date.now() / 1000) + 300,
        ip: requestIp(request),
        jti: base64UrlEncode(nonceBytes)
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
        if (payload.path !== pathname) return false;
        if (!CONVERSION_PATHS.has(pathname)) return false;
        if (payload.exp < Math.floor(Date.now() / 1000)) return false;
        if (payload.ip !== requestIp(request)) return false;
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
        let body = await readBoundedBytes(request, MAX_CONVERSION_SIZE);
        if (!body.byteLength || body.byteLength > MAX_CONVERSION_SIZE) return jsonResponse({ error: 'File is empty or exceeds the 50MB limit.' }, 413, corsHeaders);
        if (!isValidConversionDocument(pathname, new Uint8Array(body))) {
            return jsonResponse({ error: 'The file contents do not match a supported document format.' }, 415, corsHeaders);
        }
        const headers = { 'Content-Type': contentType, 'Accept': 'application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json' };
        if (env.MODAL_API_TOKEN) headers.Authorization = `Bearer ${env.MODAL_API_TOKEN}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);
        try {
        const response = await fetch(upstream, { method: 'POST', headers, body, signal: controller.signal });
        body = null; // Input validation/upload is complete; do not retain it during output buffering.
        if (!response.ok) {
            response.body?.cancel().catch(() => {});
            console.error('[Conversion] upstream failure', pathname, response.status);
            return jsonResponse({ error: 'Conversion failed. Please verify the document and try again.' }, response.status >= 500 ? 502 : 400, corsHeaders);
        }
        // Keep both document directions within the same 50 MB parser budget.
        const output = await readBoundedBytes(response, MAX_CONVERSION_SIZE, { signal: controller.signal, timeoutMs: 120000 });
        if (!output.byteLength) return jsonResponse({ error: 'Conversion returned an empty file.' }, 502, corsHeaders);
        if (!isValidConversionOutput(pathname, output)) {
            console.error('[Conversion] upstream returned an invalid output signature', pathname);
            return jsonResponse({ error: 'Conversion returned an invalid document.' }, 502, corsHeaders);
        }
        const responseHeaders = new Headers(corsHeaders);
        responseHeaders.set('Content-Type', pathname.endsWith('pdf-to-word') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf');
        responseHeaders.set('Content-Disposition', 'attachment');
        responseHeaders.set('Cache-Control', 'no-store');
        responseHeaders.set('X-Content-Type-Options', 'nosniff');
        return new Response(output, { status: 200, headers: responseHeaders });
        } finally {
            clearTimeout(timeout);
        }
    } catch (err) {
        console.error('[Conversion] request failed', pathname, err);
        if (err.name === 'BodyTooLargeError') return jsonResponse({ error: 'Document exceeds the 50MB processing limit.' }, 413, corsHeaders);
        return jsonResponse({ error: 'Conversion service is temporarily unavailable.' }, 502, corsHeaders);
    }
}

// Read at most maxBytes and stop as soon as a streamed body crosses the limit.
// The deadline also covers stalled bodies after response headers have arrived.
async function readBoundedBytes(message, maxBytes, { signal, timeoutMs = 30000 } = {}) {
    const tooLarge = () => Object.assign(new Error('Body exceeds the byte limit.'), { name: 'BodyTooLargeError' });
    const declared = Number(message.headers.get('content-length') || 0);
    if (Number.isFinite(declared) && declared > maxBytes) {
        message.body?.cancel().catch(() => {});
        throw tooLarge();
    }
    if (!message.body) return new Uint8Array(0);
    const reader = message.body.getReader();
    let interrupted = false;
    let rejectAbort;
    const aborted = new Promise((_, reject) => { rejectAbort = reject; });
    const abort = () => {
        interrupted = true;
        rejectAbort(new DOMException('Body read timed out or was aborted.', 'AbortError'));
        reader.cancel().catch(() => {});
    };
    const timer = setTimeout(abort, timeoutMs);
    signal?.addEventListener('abort', abort, { once: true });
    let storage = new Uint8Array(Math.min(maxBytes, 65536));
    let length = 0;
    try {
        if (signal?.aborted) throw new DOMException('Body read aborted.', 'AbortError');
        while (true) {
            const { done, value } = await Promise.race([reader.read(), aborted]);
            if (interrupted || signal?.aborted) throw new DOMException('Body read aborted.', 'AbortError');
            if (done) break;
            if (length + value.byteLength > maxBytes) throw tooLarge();
            if (length + value.byteLength > storage.length) {
                const grown = new Uint8Array(Math.min(maxBytes, Math.max(length + value.byteLength, storage.length * 2)));
                grown.set(storage.subarray(0, length));
                storage = grown;
            }
            storage.set(value, length);
            length += value.byteLength;
        }
        return storage.subarray(0, length);
    } catch (error) {
        reader.cancel().catch(() => {});
        throw error;
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        reader.releaseLock();
    }
}

async function readJsonRequest(request, maxBytes = MAX_JSON_SIZE) {
    try {
        const text = new TextDecoder().decode(await readBoundedBytes(request, maxBytes));
        const data = JSON.parse(text);
        return { data };
    } catch (error) {
        if (error.name === 'BodyTooLargeError') return { error: 'Request is too large.' };
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
        const text = new TextDecoder().decode(await readBoundedBytes(response, 2 * 1024 * 1024, { signal: controller.signal }));
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

        const requestedModel = typeof body.model === 'string' && ALLOWED_CHAT_MODELS.has(body.model)
            ? body.model
            : 'openai/gpt-oss-20b';

        // Try Groq first if key is available
        if (env.GROQ_API_KEY) {
            const groqResponse = await fetchJsonUpstream('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: requestedModel,
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

        // Keep the upstream model surface deliberately small. The client can
        // request a model name, but it must be one of the models we have
        // reviewed for capability, cost, and data handling. Unknown values
        // use the free fallback instead of being forwarded to OpenRouter.
        const requestedModel = ALLOWED_VISION_MODELS.has(body.model)
            ? body.model
            : 'openrouter/free';

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
