const xlsx = require('xlsx');
const axios = require('axios');
const fs = require('fs');

async function run() {
  console.log("Fetching Master Products from live database...");
  const res = await axios.get('https://darkslategrey-snail-415133.hostingersite.com/master-products');
  const masterProducts = res.data;
  console.log(`Found ${masterProducts.length} Master Products in live DB.`);

  console.log("Reading Excel file...");
  const workbook = xlsx.readFile('C:\\Users\\888am\\OneDrive\\Desktop\\DATASET\\stock_81.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet);
  console.log(`Found ${rows.length} rows in Excel file.`);

  const matches = [];
  const unmatched = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Based on the screenshot, column headers are:
    // "Product Name", "M.R.P.", "Sales Price", "Barcode"
    // xlsx parses headers from the first row it finds. If there are merged cells, we might need to adjust.
    // Let's assume standard object keys based on the image:
    
    // Fallback: If headers are messed up, we just stringify the row to find values.
    const rowStr = JSON.stringify(row);
    let productName = row['Product Name'] || row['Product name'] || row['Name'];
    let mrp = row['M.R.P.'] || row['MRP'] || row['mrp'];
    let salesPrice = row['Sales Price'] || row['salesPrice'];
    
    // If standard headers failed, try fuzzy extraction for this specific shop format
    if (!productName) {
      const keys = Object.keys(row);
      productName = row[keys[1]]; // "Product Name" is the 2nd column in the screenshot
      mrp = row[keys[10]]; // "M.R.P." is around the 11th column
      salesPrice = row[keys[12]]; // "Sales Price" is around the 13th column
    }

    if (!productName) continue; // Skip totally blank rows

    const nameToMatch = String(productName).toLowerCase().trim();
    
    // Fuzzy matching logic
    // 1. Exact lowercase match
    // 2. Contains match (e.g. "22 powder" in "santoor powder 22g")
    
    let matchedProduct = masterProducts.find(p => p.name.toLowerCase() === nameToMatch);
    
    if (!matchedProduct) {
      // Try a looser match: does the Master DB name contain the Excel name?
      // Or does the Excel name contain the Master DB name?
      matchedProduct = masterProducts.find(p => {
        const dbName = p.name.toLowerCase();
        return dbName.includes(nameToMatch) || nameToMatch.includes(dbName);
      });
    }

    if (matchedProduct) {
      matches.push({
        Excel_Name: productName,
        Excel_MRP: mrp,
        Excel_Sales_Price: salesPrice,
        DB_Matched_Name: matchedProduct.name,
        DB_Matched_MRP: matchedProduct.mrp,
        DB_Product_ID: matchedProduct._id,
        Image_Found: matchedProduct.image ? 'Yes' : 'No'
      });
    } else {
      unmatched.push({
        Excel_Name: productName,
        Excel_MRP: mrp,
        Reason: 'Not found in PackItOut database'
      });
    }
  }

  console.log(`\n--- RESULTS ---`);
  console.log(`Perfect Matches Found: ${matches.length}`);
  console.log(`Unmatched Products (Skipped): ${unmatched.length}`);

  // Write matches to CSV
  if (matches.length > 0) {
    const matchWs = xlsx.utils.json_to_sheet(matches);
    const matchWb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(matchWb, matchWs, "Matches");
    xlsx.writeFile(matchWb, 'C:\\Users\\888am\\OneDrive\\Desktop\\shop\\scratch\\Matches_To_Review.xlsx');
    console.log("Saved matches to: shop\\scratch\\Matches_To_Review.xlsx");
  }

  if (unmatched.length > 0) {
    const unmatchedWs = xlsx.utils.json_to_sheet(unmatched);
    const unmatchedWb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(unmatchedWb, unmatchedWs, "Unmatched");
    xlsx.writeFile(unmatchedWb, 'C:\\Users\\888am\\OneDrive\\Desktop\\shop\\scratch\\Unmatched_Products.xlsx');
    console.log("Saved unmatched items to: shop\\scratch\\Unmatched_Products.xlsx");
  }
}

run().catch(console.error);
