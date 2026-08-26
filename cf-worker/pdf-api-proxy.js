/**
 * Cloudflare Worker — API Proxy for OnlinePDFPro
 * 
 * Routes:
 *   POST /ai/chat    — Groq LLM (text chat, summarizer, flashcards)
 *   POST /ai/vision  — OpenRouter (vision/multimodal models)
 *   POST /store/create-order — Create Razorpay order
 *   POST /store/verify-payment — Verify Razorpay signature
 *   GET  /health     — Health check
 * 
 * Deploy: npx wrangler deploy (from cf-worker directory)
 * 
 * Secrets (set via Wrangler CLI, never in wrangler.toml):
 *   - GROQ_API_KEY (secret: npx wrangler secret put GROQ_API_KEY)
 *   - OPENROUTER_API_KEY (secret: npx wrangler secret put OPENROUTER_API_KEY)
 *   - RAZORPAY_KEY_ID (secret: npx wrangler secret put RAZORPAY_KEY_ID)
 *   - RAZORPAY_KEY_SECRET (secret: npx wrangler secret put RAZORPAY_KEY_SECRET)
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
            return handleCORS(request);
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

        // Protect paid endpoints from scripted/bot access (no allowed Origin = not a browser)
        if (['/ai/chat', '/ai/vision', '/store/create-order', '/store/verify-payment', '/store/download', '/store/my-purchases'].includes(url.pathname) && !isAllowedOrigin(request, env)) {
            return new Response(JSON.stringify({ error: 'Forbidden: requests must come from the OnlinePDFPro website.' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(request, allowedOrigins) }
            });
        }

        // AI Chat proxy (Groq — text-only LLM)
        if (url.pathname === '/ai/chat' && request.method === 'POST') {
            return handleGroqChat(request, env, allowedOrigins);
        }

        // AI Vision proxy (OpenRouter — multimodal)
        if (url.pathname === '/ai/vision' && request.method === 'POST') {
            return handleOpenRouterVision(request, env, allowedOrigins);
        }

        if (url.pathname === '/health') {
            return new Response(JSON.stringify({ status: 'ok', service: 'OnlinePDFPro API Proxy', routes: ['/ai/chat', '/ai/vision'] }), {
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
    };
}

function handleCORS(request) {
    return new Response(null, {
        status: 204,
        headers: getCORSHeaders(request)
    });
}

// ─── Supabase Helper ──────────────────────────────────────────────────

async function supabaseQuery(env, path, method, body, token) {
    const headers = {
        'Content-Type': 'application/json',
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${token || env.SUPABASE_SERVICE_ROLE_KEY}`
    };
    const opts = { method, headers };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, opts);
    const text = await res.text();
    try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
    catch { return { ok: res.ok, status: res.status, data: text }; }
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
        if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
            return jsonResponse({ error: 'Razorpay keys missing' }, 500, corsHeaders);
        }

        // Verify user is logged in
        const userId = await verifySupabaseJWT(env, request.headers.get('Authorization'));
        if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);

        const body = await request.json();
        const { product_id } = body;
        if (!product_id) return jsonResponse({ error: 'product_id required' }, 400, corsHeaders);

        // Fetch product price from Supabase
        const productRes = await supabaseQuery(env, `products?id=eq.${product_id}&select=id,price_inr,title`, 'GET');
        if (!productRes.ok || !productRes.data?.length) {
            return jsonResponse({ error: 'Product not found' }, 404, corsHeaders);
        }
        const product = productRes.data[0];
        const amount = product.price_inr;

        // Create Razorpay Order
        const rzpAuth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${rzpAuth}`
            },
            body: JSON.stringify({ amount, currency: 'INR' })
        });
        
        if (!rzpResponse.ok) {
            const err = await rzpResponse.text();
            return jsonResponse({ error: 'Razorpay API error: ' + err }, 500, corsHeaders);
        }
        
        const rzpOrder = await rzpResponse.json();

        // Save order to Supabase with status 'created'
        await supabaseQuery(env, 'orders', 'POST', {
            user_id: userId,
            product_id: product_id,
            razorpay_order_id: rzpOrder.id,
            amount_inr: amount,
            status: 'created'
        });
        
        return jsonResponse({
            order_id: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            key: env.RAZORPAY_KEY_ID  // Send the key to frontend so it doesn't need to be hardcoded
        }, 200, corsHeaders);

    } catch (err) {
        return jsonResponse({ error: 'Create order error: ' + err.message }, 500, corsHeaders);
    }
}

async function handleVerifyPayment(request, env, allowedOrigins) {
    const corsHeaders = getCORSHeaders(request, allowedOrigins);
    try {
        if (!env.RAZORPAY_KEY_SECRET) {
            return jsonResponse({ error: 'Razorpay secret missing' }, 500, corsHeaders);
        }

        const userId = await verifySupabaseJWT(env, request.headers.get('Authorization'));
        if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);

        const body = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, product_id } = body;
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return jsonResponse({ error: 'Missing payment details' }, 400, corsHeaders);
        }

        // Verify Signature with Web Crypto API
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(env.RAZORPAY_KEY_SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );
        
        const data = encoder.encode(razorpay_order_id + '|' + razorpay_payment_id);
        
        const hexToBuffer = (hex) => {
            const typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
            return typedArray.buffer;
        };

        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            hexToBuffer(razorpay_signature),
            data
        );

        if (!isValid) {
            return jsonResponse({ error: 'Invalid signature' }, 400, corsHeaders);
        }

        // Update order to 'paid' in Supabase
        await supabaseQuery(env, 
            `orders?razorpay_order_id=eq.${razorpay_order_id}`, 
            'PATCH', 
            {
                razorpay_payment_id,
                razorpay_signature,
                status: 'paid'
            }
        );

        return jsonResponse({ success: true, message: 'Payment verified' }, 200, corsHeaders);

    } catch (err) {
        return jsonResponse({ error: 'Verify payment error: ' + err.message }, 500, corsHeaders);
    }
}

// ─── Store: Secure Download from R2 ───────────────────────────────────

async function handleDownload(request, env, allowedOrigins) {
    const corsHeaders = getCORSHeaders(request, allowedOrigins);
    try {
        const userId = await verifySupabaseJWT(env, request.headers.get('Authorization'));
        if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);

        const body = await request.json();
        const { product_id } = body;
        if (!product_id) return jsonResponse({ error: 'product_id required' }, 400, corsHeaders);

        // Check if user has purchased this product
        const orderRes = await supabaseQuery(env,
            `orders?user_id=eq.${userId}&product_id=eq.${product_id}&status=eq.paid&select=id`,
            'GET'
        );
        if (!orderRes.ok || !orderRes.data?.length) {
            return jsonResponse({ error: 'You have not purchased this product' }, 403, corsHeaders);
        }

        // Get the R2 key from products table
        const productRes = await supabaseQuery(env,
            `products?id=eq.${product_id}&select=r2_key,title`,
            'GET'
        );
        if (!productRes.ok || !productRes.data?.length) {
            return jsonResponse({ error: 'Product not found' }, 404, corsHeaders);
        }

        const r2Key = productRes.data[0].r2_key;
        const title = productRes.data[0].title;

        // Fetch file from R2
        const object = await env.PRODUCTS_BUCKET.get(r2Key);
        if (!object) {
            return jsonResponse({ error: 'File not found in storage' }, 404, corsHeaders);
        }

        // Stream the PDF to the user
        const filename = r2Key.split('/').pop() || 'download.pdf';
        return new Response(object.body, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store'
            }
        });

    } catch (err) {
        return jsonResponse({ error: 'Download error: ' + err.message }, 500, corsHeaders);
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
            `orders?user_id=eq.${userId}&status=eq.paid&select=id,product_id,amount_inr,created_at,products(id,title,description)`,
            'GET'
        );

        if (!res.ok) {
            return jsonResponse({ error: 'Failed to fetch purchases' }, 500, corsHeaders);
        }

        return jsonResponse({ purchases: res.data || [] }, 200, corsHeaders);

    } catch (err) {
        return jsonResponse({ error: 'My purchases error: ' + err.message }, 500, corsHeaders);
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
