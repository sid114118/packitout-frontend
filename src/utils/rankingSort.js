// Stable rank-then-original sort that promotes products of admin-picked
// brands to the top of any list. Items whose brand isn't in the list keep
// their normal order behind the listed ones. Pure function — safe to call
// inside useMemo without worrying about referential identity issues.
//
// config shape: { enabled: boolean, brandOrder: string[] (lowercased) }
export function applyBrandPriority(items, config) {
  if (!Array.isArray(items) || items.length === 0) return items;
  if (!config || !config.enabled) return items;
  const order = Array.isArray(config.brandOrder) ? config.brandOrder : [];
  if (order.length === 0) return items;

  const rankByBrand = new Map();
  for (let i = 0; i < order.length; i++) {
    rankByBrand.set(String(order[i] || '').toLowerCase(), i);
  }

  // Decorate-sort-undecorate so equally-ranked items keep their original
  // relative order. Array.sort isn't guaranteed stable across all engines
  // older than ES2019, and on hot paths this is cheap insurance.
  const decorated = items.map((item, originalIdx) => {
    const brand = String((item && item.brand) || '').toLowerCase();
    const rank = rankByBrand.has(brand) ? rankByBrand.get(brand) : Number.MAX_SAFE_INTEGER;
    return { item, originalIdx, rank };
  });

  decorated.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.originalIdx - b.originalIdx;
  });

  return decorated.map((d) => d.item);
}
