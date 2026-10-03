import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

export async function waitForSiteRelease({ origin, release, get, attempts = 12,
    pause = setTimeout, report = console.log }) {
    assert.ok(release && release !== 'local', 'An immutable frontend release is required');
    assert.ok(Number.isInteger(attempts) && attempts >= 1 && attempts <= 12, 'Frontend readiness attempts must be bounded');
    let lastFailure = 'No response';
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            // Each probe has a distinct cache key so a stale first response
            // cannot conceal the newly activated Pages deployment.
            const response = await get(`${origin}/release.json?check=${encodeURIComponent(release)}&attempt=${attempt}`);
            assert.equal(response.status, 200, 'Release metadata must return HTTP 200');
            const current = await response.json();
            assert.equal(current.release, release, `Observed frontend release: ${current.release}`);
            return current;
        } catch (error) { lastFailure = error.message; }
        if (attempt < attempts) {
            report(`Waiting for public frontend release (${attempt}/${attempts})`);
            await pause(5000);
        }
    }
    throw new Error(`Live frontend must serve the published release ${release}; readiness failed after ${attempts} attempts: ${lastFailure}`);
}
