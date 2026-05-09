// Inject Cloudinary delivery transforms (auto format/quality + width cap) so we
// don't ship full-resolution originals to small UI slots. Non-Cloudinary URLs
// pass through untouched.
export function cdnImage(url, width = 400) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  if (!url.includes('/upload/')) return url;
  // Skip if transforms already applied (avoid stacking).
  const afterUpload = url.split('/upload/')[1] || '';
  if (/^[a-z0-9_,.]+\//i.test(afterUpload) && /[wqf]_/.test(afterUpload.split('/')[0])) {
    return url;
  }
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}
