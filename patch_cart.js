import fs from 'fs';

let content = fs.readFileSync('src/Cart.jsx', 'utf8');

content = content.replace(
  'const isDiscounted = originalPrice > safePrice;',
  `const isDiscounted = originalPrice > safePrice;
            let isOutOfStock = false;
            if (targetShop && targetShop.inventory) {
              const inv = targetShop.inventory.find(i => i.product?._id === item._id || i.product === item._id);
              if (!inv || inv.inStock === false) isOutOfStock = true;
            }`
);

content = content.replace(
  `{isDiscounted && <span style={{ position: 'absolute', top: '-6px', left: '-6px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.55rem', fontWeight: '900', padding: '3px 6px', borderRadius: '6px', zIndex: 1 }}>OFFER</span>}`,
  `{isDiscounted && !isOutOfStock && <span style={{ position: 'absolute', top: '-6px', left: '-6px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.55rem', fontWeight: '900', padding: '3px 6px', borderRadius: '6px', zIndex: 1 }}>OFFER</span>}
                  {isOutOfStock && <span style={{ position: 'absolute', top: '-6px', left: '-6px', backgroundColor: '#64748b', color: '#fff', fontSize: '0.55rem', fontWeight: '900', padding: '3px 6px', borderRadius: '6px', zIndex: 1 }}>OUT OF STOCK</span>}`
);

content = content.replace(
  `{item.image ? <img src={cdnImage(item.image, 200)} loading="lazy" decoding="async" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain', mixBlendMode: 'multiply' }} alt={item.name} /> : <span style={{ fontSize: '30px' }}>{item.emoji}</span>}`,
  `{item.image ? <img src={cdnImage(item.image, 200)} loading="lazy" decoding="async" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain', mixBlendMode: 'multiply', opacity: isOutOfStock ? 0.3 : 1, filter: isOutOfStock ? 'grayscale(100%)' : 'none' }} alt={item.name} /> : <span style={{ fontSize: '30px', opacity: isOutOfStock ? 0.3 : 1 }}>{item.emoji}</span>}`
);

content = content.replace(
  `<span>{targetShop && !targetShop.isOpen ? 'Place Pre-Order' : 'Choose Pickup Time'}</span>`,
  `<span>{hasOutOfStock ? 'Remove out-of-stock items' : (targetShop && !targetShop.isOpen ? 'Place Pre-Order' : 'Choose Pickup Time')}</span>`
);

fs.writeFileSync('src/Cart.jsx', content);
console.log("Updated Cart.jsx!");
