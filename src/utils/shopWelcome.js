// Global event dispatcher for the full-screen shop welcome animation
export function triggerShopWelcome(shop) {
  if (!shop) return;
  const name = typeof shop === 'string' ? shop : (shop.name || 'Your Local Store');
  const pincode = typeof shop === 'object' ? (shop.pincode || '') : '';
  const isOpen = typeof shop === 'object' ? (shop.isOpen !== false) : true;

  window.dispatchEvent(new CustomEvent('SHOW_SHOP_WELCOME', {
    detail: { name, pincode, isOpen }
  }));
}
