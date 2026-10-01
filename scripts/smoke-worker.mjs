#!/usr/bin/env node
// Safe production probes: these requests never submit documents, pay for AI,
// create orders, or modify customer data. A stale Worker must fail this gate.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

export const requiredRoutes = [
    '/ai/chat', '/ai/vision', '/convert/token', '/convert/pdf-to-word',
    '/convert/word-to-pdf', '/store/create-order', '/store/verify-payment',
    '/store/razorpay-webhook', '/store/download', '/store/my-purchases'
];

export async function smokeWorker({ baseUrl, release, request = fetch }) {
    assert.ok(release && release !== 'local', 'An explicit production release ID is required');
    const probe = async (route, options = {}) => {
        const response = await request(new URL(route, baseUrl), {
            ...options, redirect: 'error', signal: AbortSignal.timeout(15_000),
            headers: { Origin: 'https://onlinepdfpro.com', ...options.headers }
        });
        assert.match(response.headers.get('content-type') || '', /application\/json/i, `${route}: expected JSON`);
        return { response, body: await response.json() };
    };
    const health = await probe(`/health?release_check=${encodeURIComponent(release)}`);
    assert.equal(health.response.status, 200, 'Health must return 200');
    assert.equal(health.body.status, 'ok', 'Health must report ok');
    assert.equal(health.body.release, release, 'Worker release must match the frontend source revision');
    assert.ok(Array.isArray(health.body.routes), 'Health must declare routes');
    for (const route of requiredRoutes) assert.ok(health.body.routes.includes(route), `Missing API route: ${route}`);

    const unknown = await probe('/not-a-real-route');
    assert.equal(unknown.response.status, 404, 'Unknown routes must return 404');
    for (const route of ['/ai/chat', '/ai/vision', '/convert/token', '/convert/pdf-to-word', '/convert/word-to-pdf']) {
        const result = await probe(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        assert.equal(result.response.status, 403, `${route}: unauthenticated work must be rejected`);
        assert.equal(typeof result.body.error, 'string', `${route}: usable error required`);
    }
    for (const route of ['/store/create-order', '/store/verify-payment', '/store/download', '/store/my-purchases']) {
        const result = await probe(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        assert.equal(result.response.status, 401, `${route}: login must be required`);
    }
    const hostile = await probe('/ai/chat', { method: 'POST', headers: {
        Origin: 'https://not-onlinepdfpro.example', 'Content-Type': 'application/json'
    }, body: '{}' });
    assert.equal(hostile.response.status, 403, 'Protected routes must reject untrusted browser origins');
    assert.equal(hostile.response.headers.get('access-control-allow-origin'), null, 'No CORS permission for an untrusted origin');
    const preflight = await request(new URL('/convert/token', baseUrl), {
        method: 'OPTIONS', headers: { Origin: 'https://onlinepdfpro.com', 'Access-Control-Request-Method': 'POST' },
        redirect: 'error', signal: AbortSignal.timeout(15_000)
    });
    assert.equal(preflight.status, 204, 'Allowed conversion preflight must succeed');
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://onlinepdfpro.com');
    return { release, checkedRoutes: requiredRoutes.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const args = process.argv.slice(2);
    const release = args[args.indexOf('--release') + 1];
    const baseUrl = process.env.API_BASE_URL || 'https://onlinepdfpro-proxy.prem736raj.workers.dev';
    try {
        const result = await smokeWorker({ baseUrl, release: args.includes('--release') ? release : process.env.GITHUB_SHA });
        console.log(`PASS Worker release ${result.release}: all ${result.checkedRoutes} required routes and protection probes`);
    } catch (error) {
        console.error(`Worker release gate failed: ${error.message}`);
        process.exitCode = 1;
    }
}
