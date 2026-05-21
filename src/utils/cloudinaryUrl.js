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

// Tiny inline SVG placeholder for failed image loads — keeps the layout stable
// instead of showing a broken-image icon when Cloudinary returns 4xx/5xx, the
// hosted file is deleted, or the user is offline. Wire via:
//   <img src={cdnImage(item.image)} onError={handleImageError} alt="" />
const PLACEHOLDER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
    <rect width='100' height='100' fill='#f1f5f9'/>
    <text x='50' y='58' font-family='system-ui,sans-serif' font-size='42' text-anchor='middle' fill='#94a3b8'>🛒</text>
  </svg>`
)}`;

export function handleImageError(e) {
  if (e?.target && e.target.src !== PLACEHOLDER_SVG) {
    e.target.onerror = null; // prevent infinite loop if placeholder itself ever fails
    e.target.src = PLACEHOLDER_SVG;
  }
}

export { PLACEHOLDER_SVG };
