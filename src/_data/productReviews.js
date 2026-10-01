const fs = require('node:fs');
const path = require('node:path');

// Only consented, manually approved public reviews belong in this file.
// Keep purchase receipts, email addresses and moderation evidence outside Git.
const content = JSON.parse(fs.readFileSync(path.join(__dirname, '../../content/product-reviews.json'), 'utf8'));
const hasText = value => typeof value === 'string' && Boolean(value.trim());
const isDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
for (const [productId, entry] of Object.entries(content)) {
  if (!entry.expertReview || !['pending', 'published'].includes(entry.expertReview.status) || !Array.isArray(entry.reviews)) {
    throw new Error(`Invalid review data for ${productId}`);
  }
  if (entry.expertReview.status === 'published') {
    const expert = entry.expertReview;
    if (!hasText(expert.name) || !hasText(expert.qualifications) || !hasText(expert.scope) || !hasText(expert.summary) || !isDate(expert.reviewedOn)) {
      throw new Error(`A published expert review needs attribution, date and scope: ${productId}`);
    }
  }
  const ids = new Set();
  for (const review of entry.reviews) {
    if (!hasText(review.id) || ids.has(review.id) || !hasText(review.displayName) || !hasText(review.text) ||
        !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5 ||
        !isDate(review.publishedOn) || typeof review.verifiedPurchase !== 'boolean' || review.publicationConsent !== true) {
      throw new Error(`Published reviews need a unique ID, real content, rating, date and consent: ${productId}`);
    }
    ids.add(review.id);
  }
  entry.count = entry.reviews.length;
  entry.average = entry.count ? (entry.reviews.reduce((sum, review) => sum + review.rating, 0) / entry.count).toFixed(1) : null;
}
module.exports = content;
