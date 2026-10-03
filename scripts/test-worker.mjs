#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { smokeWorker } from './smoke-worker.mjs';

// Load the real ES-module handler without changing the site's CommonJS setup.
const source = await fs.readFile(new URL('../cf-worker/pdf-api-proxy.js', import.meta.url), 'utf8');
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const limiter = { async limit() { return { success: true }; } };
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
