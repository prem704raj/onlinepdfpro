/**
 * Cloudflare Worker — API Proxy for OnlinePDFPro
 * 
 * Routes:
 *   POST /ai/chat    — Groq LLM (text chat, summarizer, flashcards)
 *   POST /ai/vision  — OpenRouter (vision/multimodal models)
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

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // 20 MB
const RATE_LIMIT_CACHE = new Map();
const MAX_REQUESTS_PER_MINUTE = 50;

// Browser POSTs always send an Origin header from an allowed domain; curl and
// scripts do not. Requiring an allowed Origin on the paid endpoints blocks
// direct abuse of the Groq/OpenRouter keys while keeping the site working.
function getAllowedOrigins(env) {
    const isProd = (env.ENVIRONMENT || 'production') === 'production';
    return isProd ? PROD_ORIGINS : [...PROD_ORIGINS, ...DEV_ORIGINS];
}

function isAllowedOrigin(request, env) {
    const origin = request.headers.get('Origin') || '';
    return getAllowedOrigins(env).includes(origin);
}

function checkRateLimit(ip) {
    if (!ip || ip === 'unknown') return true;
    const now = Date.now();
    let data = RATE_LIMIT_CACHE.get(ip);
    
    // Clear old entries occasionally to prevent memory leaks
    if (RATE_LIMIT_CACHE.size > 10000) {
        RATE_LIMIT_CACHE.clear();
    }

    if (!data || now - data.windowStart > 60000) {
        RATE_LIMIT_CACHE.set(ip, { windowStart: now, count: 1 });
        return true;
    }
    if (data.count >= MAX_REQUESTS_PER_MINUTE) {
        return false;
    }
    data.count++;
    return true;
}

export default {
    async fetch(request, env) {
        const allowedOrigins = getAllowedOrigins(env);

        // CORS preflight
        if (request.method === 'OPTIONS') {
            return handleCORS(request, allowedOrigins);
        }

        const ip = request.headers.get('cf-connecting-ip') || 'unknown';
        if (!checkRateLimit(ip)) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in a minute.' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(request) }
            });
        }

        // Check file size for POST requests
        if (request.method === 'POST') {
            const contentLength = request.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > MAX_UPLOAD_SIZE) {
                return new Response(JSON.stringify({ error: 'Payload too large. Maximum size is 20MB.' }), {
                    status: 413,
                    headers: { 'Content-Type': 'application/json', ...getCORSHeaders(request) }
                });
            }
        }

        const url = new URL(request.url);

        // Razorpay webhooks are server-to-server requests and intentionally do
        // not carry a browser Origin header. Authenticate them with the
        // webhook HMAC instead of the browser-origin guard below.
        if (url.pathname === '/store/razorpay-webhook' && request.method === 'POST') {
            return handleRazorpayWebhook(request, env, allowedOrigins);
        }

        // Protect paid endpoints from scripted/bot access (no allowed Origin = not a browser)
        if (['/ai/chat', '/ai/vision', '/store/create-order', '/store/verify-payment', '/store/download', '/store/my-purchases'].includes(url.pathname) && !isAllowedOrigin(request, env)) {

        // Protect paid endpoints from scripted/bot access (no allowed Origin = not a browser)
        if (['/ai/chat', '/ai/vision', '/store/create-order', '/store/verify-payment', '/store/download', '/store/my-purchases'].includes(url.pathname) && !isAllowedOrigin(request, env)) {
            return new Response(JSON.stringify({ error: 'Forbidden: requests must come from the OnlinePDFPro website.' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(request, allowedOrigins) }
            });
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
                routes: ['/ai/chat', '/ai/vision', '/store/create-order', '/store/verify-payment', '/store/razorpay-webhook', '/store/download', '/store/my-purchases']
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

        return new Response('OnlinePDFPro API Proxy', {
            status: 200,
            headers: getCORSHeaders(request, allowedOrigins)
        });
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
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : PROD_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Turnstile-Token, cf-turnstile-response',
        'Access-Control-Max-Age': '86400'
    };
}

async function verifyTurnstile(token, ip, env) {
    const secret = env.TURNSTILE_SECRET_KEY || '0x4AAAAAAEh3z0I-mC0cDwyN2QldJYVyVhg';
    if (!secret) return true;
    if (!token) return false;
    try {
        const formData = new FormData();
        formData.append('secret', secret);
        formData.append('response', token);
        if (ip && ip !== 'unknown') formData.append('remoteip', ip);

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData
        });
        const outcome = await res.json();
        return outcome.success === true;
    } catch (err) {
        console.error('Turnstile verification error:', err);
        return false;
    }
}

function handleCORS(request, allowedOrigins) {
    return new Response(null, {
        status: 204,
        headers: getCORSHeaders(request, allowedOrigins)
    });
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
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, opts);
    const text = await res.text();
    try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
    catch { return { ok: res.ok, status: res.status, data: text }; }
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.replace('Bearer ', '');
    // Use Supabase auth endpoint to verify
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY
        }
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.id || null;
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

// ─── AI Proxy: Groq (text chat/summarize/flashcards) ──────────────────

async function handleGroqChat(request, env, allowedOrigins) {
    const corsHeaders = getCORSHeaders(request, allowedOrigins);

    try {
        const body = await request.json();

        // Validate required fields
        if (!body.messages || !Array.isArray(body.messages)) {
            return jsonResponse({ error: 'messages array is required' }, 400, corsHeaders);
        }

        // Try Groq first if key is available
        if (env.GROQ_API_KEY) {
            const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: body.model || 'openai/gpt-oss-20b',
                    messages: body.messages,
                    max_tokens: Math.min(body.max_tokens || 4096, 8192),
                    temperature: body.temperature ?? 0.7,
                    response_format: body.response_format || undefined
                })
            });

            const data = await groqResponse.json();

            // If Groq succeeds, return the response directly.
            if (groqResponse.ok) {
                return jsonResponse(data, groqResponse.status, corsHeaders);
            }
            // Any Groq error (rate limit, model deprecated, token limit, etc.) → fall through to OpenRouter
            console.warn('[Proxy] Groq failed (' + groqResponse.status + '), falling back to OpenRouter:', data.error?.message);
        }

        // Fallback: route through OpenRouter (same as /ai/vision handler)
        if (!env.OPENROUTER_API_KEY) {
            return jsonResponse({ error: 'No AI backend available. Both GROQ_API_KEY and OPENROUTER_API_KEY are missing.' }, 500, corsHeaders);
        }

        const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                max_tokens: Math.min(body.max_tokens || 4096, 8192),
                temperature: body.temperature ?? 0.7
            })
        });

        const orData = await orResponse.json();
        return jsonResponse(orData, orResponse.status, corsHeaders);

    } catch (err) {
        return jsonResponse({ error: 'AI proxy error: ' + err.message }, 500, corsHeaders);
    }
}

// ─── AI Proxy: OpenRouter (vision/multimodal) ─────────────────────────

async function handleOpenRouterVision(request, env, allowedOrigins) {
    const corsHeaders = getCORSHeaders(request, allowedOrigins);

    if (!env.OPENROUTER_API_KEY) {
        return jsonResponse({ error: 'OPENROUTER_API_KEY not configured' }, 500, corsHeaders);
    }

    try {
        const body = await request.json();

        if (!body.messages || !Array.isArray(body.messages)) {
            return jsonResponse({ error: 'messages array is required' }, 400, corsHeaders);
        }

        const requestedModel = body.model || 'openrouter/free';

        // Forward to OpenRouter with server-side key
        const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                max_tokens: Math.min(body.max_tokens || 4096, 8192)
            })
        });

        const data = await orResponse.json();

        // If the requested model is rate-limited/unavailable, auto-fallback
        if (!orResponse.ok && requestedModel !== 'openrouter/free' && (orResponse.status === 429 || orResponse.status === 503)) {
            console.warn(`[Proxy] Model ${requestedModel} unavailable (${orResponse.status}), retrying with openrouter/free`);
            const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
                    max_tokens: Math.min(body.max_tokens || 4096, 8192)
                })
            });
            const fallbackData = await fallbackResponse.json();
            return jsonResponse(fallbackData, fallbackResponse.status, corsHeaders);
        }

        return jsonResponse(data, orResponse.status, corsHeaders);

    } catch (err) {
        return jsonResponse({ error: 'Vision proxy error: ' + err.message }, 500, corsHeaders);
    }
}
