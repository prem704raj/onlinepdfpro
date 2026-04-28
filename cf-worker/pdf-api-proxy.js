/**
 * Cloudflare Worker — PDF Conversion Proxy for OnlinePDFPro
 * 
 * Routes file conversions to Adobe PDF Services API.
 * Deploy: npx wrangler deploy (from cf-worker directory)
 * 
 * Environment Variables:
 *   - ADOBE_CLIENT_ID (set in wrangler.toml)
 *   - ADOBE_CLIENT_SECRET (set via: npx wrangler secret put ADOBE_CLIENT_SECRET)
 * 
 * Free tier: 500 document operations/month (no card needed)
 */

const ALLOWED_ORIGINS = [
    'https://onlinepdfpro.com',
    'https://www.onlinepdfpro.com',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
];

const SUPPORTED_CONVERSIONS = {
    'pdf-docx': true,
    'pdf-xlsx': true,
    'pdf-pptx': true,
    'docx-pdf': true,
    'xlsx-pdf': true,
    'pptx-pdf': true
};

export default {
    async fetch(request, env) {
        // CORS preflight
        if (request.method === 'OPTIONS') {
            return handleCORS(request);
        }

        const url = new URL(request.url);

        if (url.pathname === '/convert' && request.method === 'POST') {
            return handleConversion(request, env);
        }

        if (url.pathname === '/health') {
            return new Response(JSON.stringify({ status: 'ok', service: 'OnlinePDFPro Conversion Proxy' }), {
                headers: { 'Content-Type': 'application/json', ...getCORSHeaders(request) }
            });
        }

        return new Response('OnlinePDFPro Conversion API. POST /convert to convert files.', {
            status: 200,
            headers: getCORSHeaders(request)
        });
    }
};

async function handleConversion(request, env) {
    const corsHeaders = getCORSHeaders(request);

    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const fromFormat = formData.get('from');
        const toFormat = formData.get('to');

        if (!file || !fromFormat || !toFormat) {
            return jsonResponse({ error: 'Missing file, from, or to parameters' }, 400, corsHeaders);
        }

        const conversionKey = `${fromFormat}-${toFormat}`;
        if (!SUPPORTED_CONVERSIONS[conversionKey]) {
            return jsonResponse({ error: `Unsupported conversion: ${fromFormat} → ${toFormat}` }, 400, corsHeaders);
        }

        const clientId = env.ADOBE_CLIENT_ID;
        const clientSecret = env.ADOBE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return jsonResponse({ error: 'Server not configured. Missing Adobe API credentials.' }, 500, corsHeaders);
        }

        // Step 1: Get Adobe access token
        console.log('Step 1: Getting Adobe access token...');
        const accessToken = await getAdobeToken(clientId, clientSecret);

        // Step 2: Create upload asset
        console.log('Step 2: Creating upload asset...');
        const { uploadUri, assetID } = await createUploadAsset(accessToken, clientId, file.name);

        // Step 3: Upload file to Adobe
        console.log('Step 3: Uploading file...');
        await uploadFile(uploadUri, file);

        // Step 4: Run conversion
        console.log('Step 4: Running conversion...');
        const resultUrl = await runConversion(accessToken, clientId, assetID, fromFormat, toFormat);

        // Step 5: Download and return result
        console.log('Step 5: Downloading result...');
        const resultResponse = await fetch(resultUrl);
        const resultBlob = await resultResponse.arrayBuffer();

        const mimeTypes = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        };

        return new Response(resultBlob, {
            headers: {
                'Content-Type': mimeTypes[toFormat] || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="converted.${toFormat}"`,
                ...corsHeaders
            }
        });
    } catch (err) {
        console.error('Conversion error:', err);
        return jsonResponse({ error: err.message || 'Conversion failed' }, 500, corsHeaders);
    }
}

// ─── Adobe API Functions ──────────────────────────────────────────────

async function getAdobeToken(clientId, clientSecret) {
    const response = await fetch('https://pdf-services-ue1.adobe.io/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error('Failed to get Adobe access token: ' + errText);
    }

    const data = await response.json();
    return data.access_token;
}

async function createUploadAsset(accessToken, clientId, filename) {
    const response = await fetch('https://pdf-services-ue1.adobe.io/assets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-api-key': clientId,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            mediaType: getMimeType(filename)
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error('Failed to create upload asset: ' + errText);
    }

    const data = await response.json();
    return { uploadUri: data.uploadUri, assetID: data.assetID };
}

async function uploadFile(uploadUri, file) {
    const arrayBuffer = await file.arrayBuffer();
    const response = await fetch(uploadUri, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: arrayBuffer
    });

    if (!response.ok) {
        throw new Error('Failed to upload file to Adobe storage');
    }
}

async function runConversion(accessToken, clientId, assetID, from, to) {
    let endpoint, body;

    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'x-api-key': clientId,
        'Content-Type': 'application/json'
    };

    if (to === 'pdf') {
        // Create PDF from DOCX/XLSX/PPTX
        endpoint = 'https://pdf-services-ue1.adobe.io/operation/createpdf';
        body = { assetID };
    } else {
        // Export PDF to DOCX/XLSX/PPTX
        endpoint = 'https://pdf-services-ue1.adobe.io/operation/exportpdf';
        body = { assetID, targetFormat: to };
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Conversion API failed (${response.status}): ${errText}`);
    }

    // Get polling URL from Location header
    const statusUrl = response.headers.get('location');
    if (!statusUrl) {
        throw new Error('No status URL returned from Adobe conversion API');
    }

    // Poll until complete (max 120 seconds = 60 polls × 2s)
    for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 2000));

        const statusResp = await fetch(statusUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'x-api-key': clientId
            }
        });

        if (!statusResp.ok) continue;

        const statusData = await statusResp.json();

        if (statusData.status === 'done') {
            // The download URI can be in different locations
            const downloadUri = statusData.asset?.downloadUri
                || statusData.resource?.downloadUri
                || statusData.content?.downloadUri;
            if (!downloadUri) {
                throw new Error('Conversion done but no download URL found in response: ' + JSON.stringify(statusData));
            }
            return downloadUri;
        }

        if (statusData.status === 'failed') {
            throw new Error('Adobe conversion failed: ' + JSON.stringify(statusData.error || statusData));
        }
    }

    throw new Error('Conversion timed out after 120 seconds');
}

// ─── Utilities ────────────────────────────────────────────────────────

function getMimeType(filename) {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    const types = {
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xls': 'application/vnd.ms-excel',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'ppt': 'application/vnd.ms-powerpoint',
        'csv': 'text/csv'
    };
    return types[ext] || 'application/octet-stream';
}

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
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
    };
}

function handleCORS(request) {
    return new Response(null, {
        status: 204,
        headers: getCORSHeaders(request)
    });
}
