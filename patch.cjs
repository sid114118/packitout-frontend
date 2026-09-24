const fs = require('fs');
let content = fs.readFileSync('packitout-api/index.js', 'utf8');
const searchString = "    if (method === 'UPI') {\n      const shop = await Shop.findById(body.shopId).select('upiId');\n      if (!shop || !shop.upiId || !String(shop.upiId).includes('@')) {";
const searchStringWin = "    if (method === 'UPI') {\r\n      const shop = await Shop.findById(body.shopId).select('upiId');\r\n      if (!shop || !shop.upiId || !String(shop.upiId).includes('@')) {";

const replaceString = `    const shop = await Shop.findById(body.shopId).select('upiId isOpen acceptsPreOrders');
    if (!shop) return res.status(404).json({ error: "Shop not found." });
    if (!shop.isOpen && shop.acceptsPreOrders === false) return res.status(400).json({ error: "This shop is closed and is not accepting pre-orders right now." });

    if (method === 'UPI') {
      if (!shop.upiId || !String(shop.upiId).includes('@')) {`;

if (content.includes(searchString)) {
  content = content.replace(searchString, replaceString);
} else if (content.includes(searchStringWin)) {
  content = content.replace(searchStringWin, replaceString);
} else {
  console.log("Could not find string to replace");
}
fs.writeFileSync('packitout-api/index.js', content);
console.log("Replaced!");
