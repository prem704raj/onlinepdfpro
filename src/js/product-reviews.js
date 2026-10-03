// Reviews are moderated by email. This creates a draft; it never sends a
// message automatically or treats an unsent draft as a published review.
document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.getElementById('reviewDialog');
  const form = document.getElementById('reviewForm');
  if (!dialog || !form) return;
  const status = document.getElementById('reviewDraftStatus');
  const draftLink = document.getElementById('reviewEmailLink');
  const copyButton = document.getElementById('reviewCopyButton');
  let draft = '';
  let opener;
  document.getElementById('writeReviewButton')?.addEventListener('click', event => {
    opener = event.currentTarget;
    status.textContent = '';
    draftLink.hidden = true;
    copyButton.hidden = true;
    dialog.showModal();
  });
  document.getElementById('reviewClose')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const name = document.getElementById('reviewName').value.trim();
    const text = document.getElementById('reviewText').value.trim();
    if (name.length < 2 || text.length < 20) {
      status.textContent = 'Enter a display name and at least 20 characters about your experience.';
      return;
    }
    draft = [
      `Product: ${form.dataset.productTitle}`,
      `Product ID: ${form.dataset.productId}`,
      `Public display name: ${name}`,
      `Rating: ${document.getElementById('reviewRating').value}/5`,
      '', 'Review:', text, '',
      'I consent to publication of this display name, rating and review after moderation.',
      'Please keep my email address and purchase information private.'
    ].join('\n');
    draftLink.href = 'mailto:support@onlinepdfpro.com?subject=' + encodeURIComponent(`Product review: ${form.dataset.productTitle}`) + '&body=' + encodeURIComponent(draft);
    draftLink.hidden = false;
    copyButton.hidden = false;
    status.textContent = 'Your draft is ready. Open it in your email app and send it from your purchase email if you bought these notes. Nothing has been sent or published yet.';
  });
  form.addEventListener('input', () => {
    if (!draft) return;
    draft = '';
    draftLink.hidden = true;
    copyButton.hidden = true;
    status.textContent = 'Your review changed. Prepare the email draft again before sending.';
  });
  copyButton.addEventListener('click', async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      status.textContent = 'Review copied. Paste it into an email to support@onlinepdfpro.com and send it when ready. It has not been published.';
    } catch {
      status.textContent = 'Copy is unavailable in this browser. Use Open email draft, or email your review to support@onlinepdfpro.com.';
    }
  });
});
