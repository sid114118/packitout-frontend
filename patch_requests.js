import fs from 'fs';

let content = fs.readFileSync('packitout-api/index.js', 'utf8');

const schemaAdd = `const productRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pincode: String,
  productName: String,
  brand: String,
  status: { type: String, default: 'Pending' }
}, { timestamps: true });
const ProductRequest = mongoose.model('ProductRequest', productRequestSchema);

const masterProductSchema`;

content = content.replace('const masterProductSchema', schemaAdd);

const routesAdd = `
// ==========================================
// 📣 PRODUCT REQUESTS
// ==========================================
app.post("/product-requests", requireUser, async (req, res) => {
  try {
    const { productName, brand, pincode } = req.body;
    if (!productName || !pincode) return res.status(400).json({ error: "Product name and pincode required." });
    const reqDoc = new ProductRequest({
      userId: req.user._id,
      pincode,
      productName,
      brand
    });
    await reqDoc.save();
    res.json(reqDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/shops/:id/product-requests", requireShop, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ error: "Shop not found." });
    
    // Find product requests in the shop's pincode
    const requests = await ProductRequest.find({ pincode: shop.pincode }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 📦 MASTER CATALOG
`;

content = content.replace('// ==========================================\r\n// 📦 MASTER CATALOG', routesAdd);
content = content.replace('// ==========================================\n// 📦 MASTER CATALOG', routesAdd);

fs.writeFileSync('packitout-api/index.js', content);
console.log("Updated ProductRequests!");
