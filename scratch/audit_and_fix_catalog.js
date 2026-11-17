const fs = require('fs');
const path = require('path');
const { classifyProduct } = require('../packitout-api/utils/grocerySearchEngine');

// Run audit
const productsFile = path.join(__dirname, 'master_products_cache.json');
const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

let correctedCount = 0;
const reclassifiedList = [];
const updatedProducts = [];

for (const p of products) {
  const fix = classifyProduct(p);
  if (fix && (fix.category !== p.category || (fix.subCategory && fix.subCategory !== p.subCategory))) {
    correctedCount++;
    reclassifiedList.push({
      _id: p._id,
      name: p.name,
      oldCategory: p.category,
      oldSubCategory: p.subCategory,
      newCategory: fix.category,
      newSubCategory: fix.subCategory,
      newSection: fix.section,
      newEmoji: fix.emoji
    });
    updatedProducts.push({
      ...p,
      category: fix.category,
      subCategory: fix.subCategory || p.subCategory,
      section: fix.section || p.section,
      emoji: fix.emoji || p.emoji
    });
  } else {
    updatedProducts.push(p);
  }
}

console.log(`Audited ${products.length} products.`);
console.log(`Identified & corrected ${correctedCount} misclassified products (${((correctedCount / products.length) * 100).toFixed(1)}%).`);
console.log('\nSample corrections:');
reclassifiedList.slice(0, 30).forEach((item, idx) => {
  console.log(`${idx + 1}. "${item.name}"`);
  console.log(`   FROM: [${item.oldCategory} > ${item.oldSubCategory}]`);
  console.log(`   TO:   [${item.newCategory} > ${item.newSubCategory}]`);
});

// Save updated cache
fs.writeFileSync(productsFile, JSON.stringify(updatedProducts, null, 2), 'utf8');
console.log(`\nSuccessfully updated ${productsFile} with audited product classifications.`);

module.exports = { classifyProduct, reclassifiedList };
