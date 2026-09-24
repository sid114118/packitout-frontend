import fs from 'fs';

let content = fs.readFileSync('packitout-api/index.js', 'utf8');

const targetStr = `    if (method === 'UPI') {
      const shop = await Shop.findById(body.shopId).select('upiId isOpen acceptsPreOrders');
      if (!shop) {
        return res.status(404).json({ error: "Shop not found." });
      }
      if (!shop.isOpen && shop.acceptsPreOrders === false) {
        return res.status(400).json({ error: "This shop is closed and is not accepting pre-orders right now." });
      }
      if (!shop || !shop.upiId || !String(shop.upiId).includes('@')) {
        return res.status(400).json({ error: "This shop has not set a UPI ID — please choose Pay on Pickup instead." });
      }
    }`;

// Replace using a simple string literal replacement, ignoring line endings by making it loose regex
const regex = /    if \(method === 'UPI'\) \{\s+const shop = await Shop\.findById\(body\.shopId\)\.select\('upiId isOpen acceptsPreOrders'\);\s+if \(!shop\) \{\s+return res\.status\(404\)\.json\(\{ error: "Shop not found\." \}\);\s+\}\s+if \(!shop\.isOpen && shop\.acceptsPreOrders === false\) \{\s+return res\.status\(400\)\.json\(\{ error: "This shop is closed and is not accepting pre-orders right now\." \}\);\s+\}\s+if \(!shop \|\| !shop\.upiId \|\| !String\(shop\.upiId\)\.includes\('@'\)\) \{\s+return res\.status\(400\)\.json\(\{ error: "This shop has not set a UPI ID — please choose Pay on Pickup instead\." \}\);\s+\}\s+\}/;

const replacement = `    const shop = await Shop.findById(body.shopId).select('upiId isOpen acceptsPreOrders');
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." });
    }
    if (!shop.isOpen && shop.acceptsPreOrders === false) {
      return res.status(400).json({ error: "This shop is closed and is not accepting pre-orders right now." });
    }

    if (method === 'UPI') {
      if (!shop.upiId || !String(shop.upiId).includes('@')) {
        return res.status(400).json({ error: "This shop has not set a UPI ID — please choose Pay on Pickup instead." });
      }
    }`;

content = content.replace(regex, replacement);

fs.writeFileSync('packitout-api/index.js', content);
console.log("Updated!");
