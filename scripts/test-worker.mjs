#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { smokeWorker } from './smoke-worker.mjs';
import { waitForSiteRelease } from './wait-for-site-release.mjs';

// Load the real ES-module handler without changing the site's CommonJS setup.
const source = await fs.readFile(new URL('../cf-worker/pdf-api-proxy.js', import.meta.url), 'utf8');
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(source + '\n//# sourceURL=worker-handler-test.mjs').toString('base64')}`);
const internal = await import(`data:text/javascript;base64,${Buffer.from(source + '\nexport { readBoundedBytes, readJsonRequest, razorpayRequest, handleConversion };\n//# sourceURL=worker-internals-test.mjs').toString('base64')}`);
const limiter = { async limit() { return { success: true }; } };

test('frontend readiness requires the exact release after stale or unavailable responses', async () => {
    let calls = 0, waits = 0;
    const urls = [];
    const result = await waitForSiteRelease({ origin: 'https://site.example', release: 'new-release',
        pause: async ms => { assert.equal(ms, 5000); waits++; }, report: () => {}, get: async url => {
            urls.push(url); calls++;
            if (calls === 1) return new Response('Not ready', { status: 404 });
            return Response.json({ release: calls === 2 ? 'old-release' : 'new-release' });
        } });
    assert.equal(result.release, 'new-release');
    assert.equal(waits, 2);
    assert.equal(new Set(urls).size, 3, 'Readiness probes must not reuse stale cache keys');
});

test('frontend readiness fails with useful diagnostics when the wrong release persists', async () => {
    let waits = 0;
    await assert.rejects(waitForSiteRelease({ origin: 'https://site.example', release: 'new-release',
        attempts: 2, pause: async () => { waits++; }, report: () => {},
        get: async () => Response.json({ release: 'old-release' })
    }), /failed after 2 attempts: Observed frontend release: old-release/);
    assert.equal(waits, 1);
});

test('frontend readiness preserves network failure diagnostics', async () => {
    await assert.rejects(waitForSiteRelease({ origin: 'https://site.example', release: 'new-release',
        attempts: 1, report: () => {}, get: async () => {
            throw new TypeError('fetch failed', { cause: Object.assign(new Error('network unreachable'), { code: 'ENETUNREACH' }) });
        }
    }), /fetch failed; ENETUNREACH; network unreachable/);
});
const env = {
    ENVIRONMENT: 'production', RELEASE_ID: 'test-release',
    API_RATE_LIMITER: limiter, AI_CHAT_LIMITER: limiter,
    AI_VISION_LIMITER: limiter, CONVERSION_LIMITER: limiter,
    TURNSTILE_SECRET_KEY: 'test-only-turnstile-secret',
    CONVERSION_SIGNING_SECRET: 'test-only-ticket-signing-secret',
    MODAL_API_TOKEN: 'test-only-modal-token',
    PDF_TO_WORD_URL: 'https://conversion.example/pdf-to-word',
    WORD_TO_PDF_URL: 'https://conversion.example/word-to-pdf',
    RAZORPAY_KEY_ID: 'test-only-key-id', RAZORPAY_KEY_SECRET: 'test-only-key-secret',
    SUPABASE_URL: 'https://database.example', SUPABASE_SERVICE_ROLE_KEY: 'test-only-service-key',
    PRODUCTS_BUCKET: { async get() { throw new Error('Unexpected object download'); } }
};
const request = (route, options = {}, bindings = env) => worker.fetch(new Request(`https://worker.example${route}`, {
    ...options, headers: { Origin: 'https://onlinepdfpro.com', 'cf-connecting-ip': '192.0.2.1', ...options.headers }
}), bindings);

test('streamed byte limits stop and cancel on the first oversized chunk', async () => {
    let pulls = 0, cancelled = false;
    const body = new ReadableStream({
        pull(controller) { pulls++; controller.enqueue(new Uint8Array(8)); },
        cancel() { cancelled = true; }
    }, { highWaterMark: 0 });
    await assert.rejects(internal.readBoundedBytes(new Response(body), 12), { name: 'BodyTooLargeError' });
    assert.equal(pulls, 2, 'Do not drain the remaining attacker-controlled stream');
    assert.equal(cancelled, true);
});

test('bounded reads accept the exact limit, reject declared oversize, and count UTF-8 bytes', async () => {
    assert.equal((await internal.readBoundedBytes(new Response('12345678'), 8)).byteLength, 8);
    const rejected = await internal.readJsonRequest(new Request('https://example.test', { method: 'POST', body: '"éé"' }), 5);
    assert.equal(rejected.error, 'Request is too large.');
    let cancelled = false;
    const body = new ReadableStream({ cancel() { cancelled = true; } }, { highWaterMark: 0 });
    await assert.rejects(internal.readBoundedBytes(new Response(body, { headers: { 'content-length': '100' } }), 8), { name: 'BodyTooLargeError' });
    assert.equal(cancelled, true);
});

test('stalled response bodies respect aborts and deadlines after headers', async () => {
    let cancelled = 0;
    const stalled = () => new Response(new ReadableStream({ cancel() { cancelled++; } }));
    const controller = new AbortController();
    const reading = internal.readBoundedBytes(stalled(), 1024, { signal: controller.signal });
    controller.abort();
    await assert.rejects(reading, { name: 'AbortError' });
    await assert.rejects(internal.readBoundedBytes(stalled(), 1024, { timeoutMs: 5 }), { name: 'AbortError' });
    assert.equal(cancelled, 2);
});

test('payment and conversion deadlines stay active during response-body consumption', async () => {
    const realFetch = globalThis.fetch, realSetTimeout = globalThis.setTimeout;
    const signals = [];
    globalThis.setTimeout = (callback, ms, ...args) => realSetTimeout(callback, ms >= 15000 ? 5 : ms, ...args);
    globalThis.fetch = async (_url, options) => {
        signals.push(options.signal);
        return new Response(new ReadableStream({ start(controller) {
            controller.enqueue(new TextEncoder().encode('%PDF-1.7\n'));
        } }));
    };
    try {
        await assert.rejects(internal.razorpayRequest(env, 'orders/order_fixture'), { name: 'AbortError' });
        const result = await internal.handleConversion(new Request('https://example.test', { method: 'POST', body: '%PDF-1.7\n',
            headers: { 'content-type': 'application/pdf' } }), env, '/convert/pdf-to-word', {});
        assert.equal(result.status, 502);
        assert.equal(signals.length, 2);
        assert.ok(signals.every(signal => signal?.aborted));
    } finally { globalThis.fetch = realFetch; globalThis.setTimeout = realSetTimeout; }
});

async function refundWebhook(event, responses, payload = { payment: { entity: { id: 'pay_fixture', order_id: 'order_fixture' } } }) {
    const originalFetch = globalThis.fetch;
    const queries = [];
    globalThis.fetch = async (url, options) => {
        queries.push({ url: String(url), ...options });
        const response = responses.shift();
        assert.ok(response, 'No unexpected database request');
        return Response.json(response.data, { status: response.status || 200 });
    };
    try {
        const raw = JSON.stringify({ event, payload });
        const secret = 'local-webhook-test-secret';
        const response = await request('/store/razorpay-webhook', { method: 'POST', body: raw,
            headers: { 'X-Razorpay-Signature': createHmac('sha256', secret).update(raw).digest('hex') }
        }, { ...env, RAZORPAY_WEBHOOK_SECRET: secret });
        return { status: response.status, body: await response.json(), queries };
    } finally { globalThis.fetch = originalFetch; }
}

for (const event of ['payment.refunded', 'refund.processed', 'refund.created', 'payment.dispute.created']) {
    test(`${event} returns a retryable error when entitlement revocation fails`, async () => {
        const result = await refundWebhook(event, [
            { data: [{ id: 'local-order', status: 'paid' }] },
            { status: 503, data: { message: 'database unavailable' } }
        ]);
        assert.equal(result.status, 503);
        assert.notEqual(result.body.processed, true);
    });
}

test('refund lookup failures and zero-row updates must not be acknowledged as processed', async () => {
    for (const responses of [
        [{ status: 503, data: {} }],
        [{ data: [{ id: 'local-order', status: 'paid' }] }, { data: [] }]
    ]) {
        const result = await refundWebhook('payment.refunded', responses);
        assert.equal(result.status, 503);
        assert.notEqual(result.body.processed, true);
    }
});

test('refund success is verified and duplicate delivery is idempotent', async () => {
    const result = await refundWebhook('payment.refunded', [
        { data: [{ id: 'local-order', status: 'paid' }] },
        { data: [{ id: 'local-order', status: 'refunded' }] }
    ]);
    assert.equal(result.status, 200);
    assert.equal(result.body.processed, true);
    assert.equal(result.queries[1].method, 'PATCH');
    assert.equal(result.queries[1].headers.Prefer, 'return=representation');
    const duplicate = await refundWebhook('payment.refunded', [{ data: [{ id: 'local-order', status: 'refunded' }] }]);
    assert.equal(duplicate.body.already_processed, true);
    assert.equal(duplicate.queries.length, 1);
});

test('refund-only and dispute-only payloads resolve their payment IDs', async () => {
    for (const payload of [{ refund: { entity: { payment_id: 'pay_fixture' } } }, { dispute: { entity: { payment_id: 'pay_fixture' } } }]) {
        const result = await refundWebhook('refund.processed', [
            { data: [{ razorpay_order_id: 'order_fixture' }] },
            { data: [{ id: 'local-order', status: 'paid' }] },
            { data: [{ id: 'local-order', status: 'refunded' }] }
        ], payload);
        assert.equal(result.body.processed, true);
        assert.match(result.queries[0].url, /razorpay_payment_id=eq.pay_fixture/);
    }
});

test('unknown authenticated refund orders are ignored, malformed IDs rejected', async () => {
    const unknown = await refundWebhook('payment.refunded', [{ data: [] }]);
    assert.equal(unknown.status, 200);
    assert.equal(unknown.body.ignored, true);
    assert.notEqual(unknown.body.processed, true);
    const malformed = await refundWebhook('payment.refunded', [], { payment: { entity: { order_id: 'invalid' } } });
    assert.equal(malformed.status, 400);
    const unavailable = await refundWebhook('refund.processed', [{ status: 503, data: {} }], { refund: { entity: { payment_id: 'pay_fixture' } } });
    assert.equal(unavailable.status, 503);
});

test('release gate accepts the real handler without calling external services', async () => {
    const originalFetch = globalThis.fetch;
    let upstreamCalls = 0;
    globalThis.fetch = async () => { upstreamCalls++; throw new Error('Unexpected external request'); };
    try {
        await smokeWorker({ baseUrl: 'https://worker.example', release: 'test-release',
            request: (url, options) => worker.fetch(new Request(url, options), env) });
        assert.equal(upstreamCalls, 0);
    } finally { globalThis.fetch = originalFetch; }
});

test('release gate rejects the stale live-style health response', async () => {
    await assert.rejects(smokeWorker({ baseUrl: 'https://worker.example', release: 'test-release', request: async () =>
        Response.json({ status: 'ok', routes: ['/ai/chat', '/ai/vision'] }) }), /release must match/);
});

test('Worker release readiness waits for activation before checking protected routes', async () => {
    let waits = 0, healthCalls = 0;
    const healthUrls = [];
    await smokeWorker({ baseUrl: 'https://worker.example', release: 'test-release',
        pause: async ms => { assert.equal(ms, 5000); waits++; },
        request: (url, options) => {
            if (new URL(url).pathname === '/health') {
                healthUrls.push(String(url));
                return worker.fetch(new Request(url, options), ++healthCalls === 1 ? { ...env, RELEASE_ID: 'previous-release' } : env);
            }
            assert.equal(healthCalls, 2, 'Protected routes must wait for the expected Worker release');
            return worker.fetch(new Request(url, options), env);
        }
    });
    assert.equal(waits, 1);
    assert.equal(new Set(healthUrls).size, 2);
});

test('Worker release readiness fails boundedly if a previous release persists', async () => {
    let waits = 0, healthCalls = 0;
    await assert.rejects(smokeWorker({ baseUrl: 'https://worker.example', release: 'test-release',
        releaseAttempts: 2, pause: async () => { waits++; },
        request: (url, options) => {
            assert.equal(new URL(url).pathname, '/health');
            healthCalls++;
            return worker.fetch(new Request(url, options), { ...env, RELEASE_ID: 'previous-release' });
        }
    }), /Worker release must match/);
    assert.equal(waits, 1);
    assert.equal(healthCalls, 2);
});

test('Worker release readiness rejects unhealthy responses immediately', async () => {
    await assert.rejects(smokeWorker({ baseUrl: 'https://worker.example', release: 'test-release',
        pause: async () => assert.fail('Unhealthy responses must not be retried'),
        request: async () => Response.json({ status: 'error', release: 'previous-release' })
    }), /Health must report ok/);
});

test('release gate waits for temporary protection readiness and then enforces the complete contract', async () => {
    let calls = 0, waits = 0;
    await smokeWorker({ baseUrl: 'https://worker.example', release: 'test-release',
        pause: async ms => { assert.equal(ms, 10000); waits++; },
        request: (url, options) => {
            const unavailable = new URL(url).pathname === '/ai/chat' && ++calls === 1;
            return worker.fetch(new Request(url, options), unavailable ? { ...env, AI_CHAT_LIMITER: undefined } : env);
        } });
    assert.equal(waits, 1);
});

test('release gate still fails when protection remains unavailable after bounded retries', async () => {
    let waits = 0;
    await assert.rejects(smokeWorker({ baseUrl: 'https://worker.example', release: 'test-release',
        protectionAttempts: 2, pause: async () => { waits++; },
        request: (url, options) => worker.fetch(new Request(url, options), { ...env, AI_CHAT_LIMITER: undefined })
    }), /503 !== 403/);
    assert.equal(waits, 1);
});

test('release gate immediately rejects an authentication bypass without retrying', async () => {
    let waits = 0;
    await assert.rejects(smokeWorker({ baseUrl: 'https://worker.example', release: 'test-release',
        pause: async () => { waits++; },
        request: (url, options) => new URL(url).pathname === '/ai/chat' ? Response.json({ result: 'unsafe success' }) :
            worker.fetch(new Request(url, options), env)
    }), /200 !== 403/);
    assert.equal(waits, 0);
});

test('release gate refuses local attribution and redirects', async () => {
    await assert.rejects(smokeWorker({ baseUrl: 'https://worker.example', release: 'local' }), /explicit production/);
    await assert.rejects(smokeWorker({ baseUrl: 'https://worker.example', release: 'test-release', request: async () =>
        new Response('Old API', { headers: { 'Content-Type': 'text/plain' } }) }), /expected JSON/);
});

for (const [route, binding] of [['/ai/chat', 'AI_CHAT_LIMITER'], ['/ai/vision', 'AI_VISION_LIMITER'], ['/convert/token', 'CONVERSION_LIMITER']]) {
    test(`${route} fails closed when its production rate limiter is missing`, async () => {
        const response = await request(route, { method: 'POST', body: '{}' }, { ...env, [binding]: undefined });
        assert.equal(response.status, 503);
    });
    test(`${route} rejects requests when the distributed quota is exhausted`, async () => {
        const response = await request(route, { method: 'POST', body: '{}' }, {
            ...env, [binding]: { async limit() { return { success: false }; } }
        });
        assert.equal(response.status, 429);
    });
}

test('conversion tickets are signed and bound to route and client IP', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async url => {
        assert.equal(String(url), 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
        return Response.json({ success: true, hostname: 'onlinepdfpro.com' });
    };
    try {
        const response = await request('/convert/token', { method: 'POST', headers: {
            'Content-Type': 'application/json', 'X-Turnstile-Token': 'test-human'
        }, body: JSON.stringify({ target: '/convert/pdf-to-word' }) });
        assert.equal(response.status, 200);
        const { token, target } = await response.json();
        assert.equal(target, '/convert/pdf-to-word');
        for (const [route, headers] of [
            ['/convert/word-to-pdf', {}],
            ['/convert/pdf-to-word', { 'cf-connecting-ip': '192.0.2.2' }]
        ]) {
            const rejected = await request(route, { method: 'POST', headers: { 'X-Conversion-Token': token, ...headers } });
            assert.equal(rejected.status, 403);
        }
        const accepted = await request('/convert/pdf-to-word', { method: 'POST', headers: {
            'X-Conversion-Token': token, 'Content-Type': 'application/pdf'
        }, body: 'invalid PDF bytes' });
        assert.equal(accepted.status, 415, 'Authorization cannot bypass document-format validation');
    } finally { globalThis.fetch = originalFetch; }
});

test('Turnstile success from another hostname cannot authorize a conversion', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => Response.json({ success: true, hostname: 'attacker.example' });
    try {
        const response = await request('/convert/token', { method: 'POST', headers: {
            'Content-Type': 'application/json', 'X-Turnstile-Token': 'test-human'
        }, body: JSON.stringify({ target: '/convert/pdf-to-word' }) });
        assert.equal(response.status, 403);
    } finally { globalThis.fetch = originalFetch; }
});
