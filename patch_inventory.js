import fs from 'fs';

let content = fs.readFileSync('packitout-api/index.js', 'utf8');

const searchRegex = /app\.post\("\/shops\/:shopId\/inventory", requireShop, async \(req, res\) => \{[\s\S]*?res\.json\(await Shop\.findById\(req\.params\.shopId\)\.populate\('inventory\.product'\)\);\s+\} catch \(err\) \{ res\.status\(500\)\.json\(\{ error: err\.message \}\); \}\s+\}\);/;

const replacement = `app.post("/shops/:shopId/inventory", requireShop, async (req, res) => {
  try {
    if (req.shop._id.toString() !== req.params.shopId) {
      return res.status(403).json({ error: "Cannot edit another shop's inventory" });
    }
    const { productId, sellingPrice, inStock } = req.body;
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: "Valid productId required." });
    }
    let priceVal;
    if (sellingPrice !== undefined) {
      priceVal = Number(sellingPrice);
      if (!Number.isFinite(priceVal) || priceVal < 0) {
        return res.status(400).json({ error: "sellingPrice must be a non-negative number." });
      }
    }
    const shop = await Shop.findById(req.params.shopId);
    const existingIndex = shop.inventory.findIndex(item => item.product && item.product.toString() === productId);
    if (existingIndex > -1) {
      const updateData = {};
      if (priceVal !== undefined) updateData[\`inventory.\${existingIndex}.sellingPrice\`] = priceVal;
      if (inStock !== undefined) updateData[\`inventory.\${existingIndex}.inStock\`] = Boolean(inStock);
      await Shop.updateOne({ _id: req.params.shopId }, { $set: updateData });
    } else {
      if (priceVal === undefined) {
        return res.status(400).json({ error: "sellingPrice required when adding a new inventory item." });
      }
      await Shop.updateOne({ _id: req.params.shopId }, { $push: { inventory: { product: productId, sellingPrice: priceVal, inStock: true } } });
    }
    res.json(await Shop.findById(req.params.shopId).populate('inventory.product'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/shops/:shopId/inventory/:productId", requireShop, async (req, res) => {
  try {
    if (req.shop._id.toString() !== req.params.shopId) {
      return res.status(403).json({ error: "Cannot edit another shop's inventory" });
    }
    await Shop.updateOne(
      { _id: req.params.shopId },
      { $pull: { inventory: { product: req.params.productId } } }
    );
    res.json(await Shop.findById(req.params.shopId).populate('inventory.product'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});`;

content = content.replace(searchRegex, replacement);

fs.writeFileSync('packitout-api/index.js', content);
console.log("Updated!");
