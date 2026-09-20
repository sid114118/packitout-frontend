const fs = require('fs');
const axios = require('axios');

async function injectInventory(phone, password) {
  const BASE_URL = 'https://darkslategrey-snail-415133.hostingersite.com';
  const shopId = '6aaf78a07234b919c3bd5665';

  try {
    console.log("Logging into The Family Mart...");
    const loginRes = await axios.post(`${BASE_URL}/shop-login`, { phone, password });
    const token = loginRes.data.sessionToken;
    
    if (!token) throw new Error("Failed to get session token!");
    console.log("Login successful! Got token.");

    console.log("Reading payload.json...");
    const products = JSON.parse(fs.readFileSync('C:\\Users\\888am\\OneDrive\\Desktop\\shop\\scratch\\payload.json', 'utf8'));
    console.log(`Ready to inject ${products.length} products...`);

    let successCount = 0;
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      try {
        await axios.post(`${BASE_URL}/shops/${shopId}/inventory`, {
          productId: p.productId,
          sellingPrice: p.sellingPrice,
          inStock: true
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        successCount++;
        process.stdout.write(`\rProgress: ${successCount} / ${products.length} inserted...`);
      } catch (err) {
        console.error(`\nFailed to insert product ${p.productId}:`, err.response?.data || err.message);
      }
    }
    
    console.log(`\n\n✅ Done! Successfully injected ${successCount} products into The Family Mart!`);

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

// Get from command line args
const phone = process.argv[2];
const password = process.argv[3];
if (!phone || !password) {
  console.error("Usage: node inject.js <phone> <password>");
  process.exit(1);
}

injectInventory(phone, password);
