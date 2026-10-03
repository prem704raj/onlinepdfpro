#!/usr/bin/env node
// A second gate for anyone invoking a production build outside GitHub Actions,
// including a misconfigured automatic Cloudflare Pages build.
import { smokeWorker } from './smoke-worker.mjs';
const release = process.env.RELEASE_ID || process.env.GITHUB_SHA || process.env.CF_PAGES_COMMIT_SHA;
try {
    await smokeWorker({ baseUrl: process.env.API_BASE_URL || 'https://onlinepdfpro-proxy.prem736raj.workers.dev', release });
    console.log(`Production build authorized by verified API release ${release}.`);
} catch (error) {
    console.error(`Production build blocked: ${error.message}`);
    process.exitCode = 1;
}
