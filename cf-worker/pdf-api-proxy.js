/**
 * Cloudflare Worker — API Proxy for OnlinePDFPro
 * 
 * Routes:
 *   POST /ai/chat    — Groq LLM (text chat, summarizer, flashcards)
 *   POST /ai/vision  — OpenRouter (vision/multimodal models)
 *   GET  /health     — Health check
 * 
 * Deploy: npx wrangler deploy (from cf-worker directory)
 * 
 * Secrets (set via Wrangler CLI, never in wrangler.toml):
 *   - GROQ_API_KEY (secret: npx wrangler secret put GROQ_API_KEY)
 *   - OPENROUTER_API_KEY (secret: npx wrangler secret put OPENROUTER_API_KEY)
 */

const ALLOWED_ORIGINS = [
    'https://onlinepdfpro.com',
    'https://www.onlinepdfpro.com',
    // Local dev servers (python http.server, Vite, Live Server). Browsers cannot
    // spoof these origins, so they are safe to allow for development.
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
function isAllowedOrigin(request) {
    const origin = request.headers.get('Origin') || '';
    return ALLOWED_ORIGINS.includes(origin);
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
        if (['/ai/chat', '/ai/vision'].includes(url.pathname) && !isAllowedOrigin(request)) {
            return new Response(JSON.stringify({ error: 'Forbidden: requests must come from the OnlinePDFPro website.' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(request) }
            });
        }

        // AI Chat proxy (Groq — text-only LLM)
        if (url.pathname === '/ai/chat' && request.method === 'POST') {
            return handleGroqChat(request, env);
        }

        // AI Vision proxy (OpenRouter — multimodal)
        if (url.pathname === '/ai/vision' && request.method === 'POST') {
            return handleOpenRouterVision(request, env);
        }

        if (url.pathname === '/health') {
            return new Response(JSON.stringify({ status: 'ok', service: 'OnlinePDFPro API Proxy', routes: ['/ai/chat', '/ai/vision'] }), {
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(request) }
            });
        }

        return new Response('OnlinePDFPro API Proxy. Available routes: POST /ai/chat, POST /ai/vision', {
            status: 200,
            headers: getCORSHeaders(request)
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

function getCORSHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
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

// ─── AI Proxy: Groq (text chat/summarize/flashcards) ──────────────────

async function handleGroqChat(request, env) {
    const corsHeaders = getCORSHeaders(request);

    if (!env.GROQ_API_KEY) {
        return jsonResponse({ error: 'GROQ_API_KEY not configured' }, 500, corsHeaders);
    }

    try {
        const body = await request.json();

        // Validate required fields
        if (!body.messages || !Array.isArray(body.messages)) {
            return jsonResponse({ error: 'messages array is required' }, 400, corsHeaders);
        }

        // Forward to Groq with server-side key
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: body.model || 'llama-3.1-8b-instant',
                messages: body.messages,
                max_tokens: Math.min(body.max_tokens || 4096, 8192),
                temperature: body.temperature ?? 0.7,
                response_format: body.response_format || undefined
            })
        });

        const data = await groqResponse.json();
        return jsonResponse(data, groqResponse.status, corsHeaders);

    } catch (err) {
        return jsonResponse({ error: 'AI proxy error: ' + err.message }, 500, corsHeaders);
    }
}

// ─── AI Proxy: OpenRouter (vision/multimodal) ─────────────────────────

async function handleOpenRouterVision(request, env) {
    const corsHeaders = getCORSHeaders(request);

    if (!env.OPENROUTER_API_KEY) {
        return jsonResponse({ error: 'OPENROUTER_API_KEY not configured' }, 500, corsHeaders);
    }

    try {
        const body = await request.json();

        if (!body.messages || !Array.isArray(body.messages)) {
            return jsonResponse({ error: 'messages array is required' }, 400, corsHeaders);
        }

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
                model: body.model || 'google/gemma-4-31b-it:free',
                messages: body.messages,
                max_tokens: Math.min(body.max_tokens || 4096, 8192)
            })
        });

        const data = await orResponse.json();
        return jsonResponse(data, orResponse.status, corsHeaders);

    } catch (err) {
        return jsonResponse({ error: 'Vision proxy error: ' + err.message }, 500, corsHeaders);
    }
}
