const fs = require('fs');
const path = require('path');

const SITE_KEY = '0x4AAAAAAEh3z6dQZ138ae8E';

const toolFiles = [
  'tools/chat-with-pdf.html',
  'src/tools/chat-with-pdf.html',
  'tools/pdf-summarizer.html',
  'src/tools/pdf-summarizer.html',
  'tools/pdf-to-flashcards.html',
  'src/tools/pdf-to-flashcards.html'
];

toolFiles.forEach(relPath => {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.log('File not found:', fullPath);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Update CSP to allow challenges.cloudflare.com in script-src and frame-src
  if (content.includes("Content-Security-Policy") && !content.includes("challenges.cloudflare.com")) {
    content = content.replace("script-src 'self'", "script-src 'self' https://challenges.cloudflare.com");
    if (content.includes("frame-src")) {
      content = content.replace("frame-src 'self'", "frame-src 'self' https://challenges.cloudflare.com");
    } else {
      content = content.replace("worker-src 'self' blob:;", "worker-src 'self' blob:; frame-src 'self' https://challenges.cloudflare.com;");
    }
  }

  // 2. Add Turnstile script tag to <head> if not present
  if (!content.includes("challenges.cloudflare.com/turnstile")) {
    const headEnd = '</head>';
    const turnstileScript = ' <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>\n' + headEnd;
    content = content.replace(headEnd, turnstileScript);
  }

  // 3. Add Turnstile token helper in JS
  const turnstileHelper = `
  // Cloudflare Turnstile token helper
  let turnstileToken = '';
  window.onTurnstileSuccess = function(token) { turnstileToken = token; };
  function getTurnstileToken() {
    if (window.turnstile) {
      try {
        const token = window.turnstile.getResponse();
        if (token) return token;
      } catch(e){}
    }
    return turnstileToken;
  }
`;

  if (!content.includes('getTurnstileToken')) {
    // Inject Turnstile widget HTML container before send button or upload area
    if (content.includes('id="sendBtn"')) {
      content = content.replace('<button id="sendBtn"', '<div class="cf-turnstile" data-sitekey="' + SITE_KEY + '" data-callback="onTurnstileSuccess" data-size="compact" style="margin-bottom:8px;"></div><button id="sendBtn"');
    } else if (content.includes('id="generateBtn"')) {
      content = content.replace('<button id="generateBtn"', '<div class="cf-turnstile" data-sitekey="' + SITE_KEY + '" data-callback="onTurnstileSuccess" data-size="compact" style="margin-bottom:8px;"></div><button id="generateBtn"');
    } else if (content.includes('id="summarizeBtn"')) {
      content = content.replace('<button id="summarizeBtn"', '<div class="cf-turnstile" data-sitekey="' + SITE_KEY + '" data-callback="onTurnstileSuccess" data-size="compact" style="margin-bottom:8px;"></div><button id="summarizeBtn"');
    }

    // Add helper JS before </script>
    const lastScriptEnd = content.lastIndexOf('</script>');
    if (lastScriptEnd !== -1) {
      content = content.slice(0, lastScriptEnd) + turnstileHelper + content.slice(lastScriptEnd);
    }

    // Add X-Turnstile-Token to headers in fetch calls
    content = content.replace(/headers:\s*{\s*'Content-Type':\s*'application\/json'\s*}/g, "headers: { 'Content-Type': 'application/json', 'X-Turnstile-Token': getTurnstileToken() }");
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated Turnstile in ${relPath}`);
});
console.log('Turnstile integration complete!');
