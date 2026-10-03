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

export async function smokeWorker({ baseUrl, release, request = fetch,
    protectionAttempts = 4, releaseAttempts = 12, pause = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
    assert.ok(release && release !== 'local', 'An explicit production release ID is required');
    assert.ok(Number.isInteger(protectionAttempts) && protectionAttempts >= 1 && protectionAttempts <= 4, 'Protection readiness attempts must be bounded');
    assert.ok(Number.isInteger(releaseAttempts) && releaseAttempts >= 1 && releaseAttempts <= 12, 'Worker release readiness attempts must be bounded');
    const probe = async (route, options = {}) => {
      for (let attempt = 1; attempt <= protectionAttempts; attempt++) {
        const response = await request(new URL(route, baseUrl), {
            ...options, redirect: 'error', signal: AbortSignal.timeout(15_000),
            headers: { Origin: 'https://onlinepdfpro.com', ...options.headers }
        });
        assert.match(response.headers.get('content-type') || '', /application\/json/i, `${route}: expected JSON`);
        const body = await response.json();
        // A newly deployed distributed rate-limit binding can briefly fail
        // while becoming available at the edge. Recheck only that exact 503;
        // never accept it as success or retry a broken authentication result.
        if (response.status === 503 && body.error === 'Service protection is temporarily unavailable.' && attempt < protectionAttempts) {
            console.log(`Waiting for Worker protection readiness (${attempt}/${protectionAttempts}): ${route}`);
            await pause(10000);
            continue;
        }
        return { response, body };
      }
    };
    let health;
    for (let attempt = 1; attempt <= releaseAttempts; attempt++) {
        health = await probe(`/health?release_check=${encodeURIComponent(release)}&attempt=${attempt}`);
        assert.equal(health.response.status, 200, 'Health must return 200');
        assert.equal(health.body.status, 'ok', 'Health must report ok');
        // Deployment publication can precede activation at another location.
        // Only wait for a known previous release; malformed/local health and
        // persistent mismatches still fail, and no route probes run early.
        if (health.body.release === release || typeof health.body.release !== 'string' || !health.body.release || health.body.release === 'local') break;
        if (attempt < releaseAttempts) {
            console.log(`Waiting for Worker release (${attempt}/${releaseAttempts}): observed ${health.body.release}`);
            await pause(5000);
        }
    }
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
