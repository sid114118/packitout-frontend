const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(`[ERROR] ${msg.text()}`);
    } else {
      logs.push(`[LOG] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => {
    logs.push(`[PAGE ERROR] ${err.message}\n${err.stack}`);
  });

  try {
    await page.goto('http://localhost:5173');
    
    // Check if we need to login
    const loginButton = await page.locator('text="Login to PackItOut"').isVisible();
    if (loginButton) {
      await page.fill('input[placeholder="10-digit mobile number"]', '8888888888');
      await page.click('button:has-text("Get OTP")');
      await page.fill('input[placeholder="6-digit OTP"]', '123456'); // assuming test OTP or we might need to bypass
      await page.click('button:has-text("Verify OTP")');
      await page.waitForTimeout(2000);
    }
    
    // Now we are logged in.
    // Go to Orders page
    await page.evaluate(() => { window.location.hash = '#orders'; });
    await page.waitForTimeout(2000);
    
    // Go to Profile page
    await page.evaluate(() => { window.location.hash = '#account'; });
    await page.waitForTimeout(2000);
    
    fs.writeFileSync('playwright_logs.txt', logs.join('\n'));
    console.log("Done logging");
  } catch (err) {
    console.error(err);
    fs.writeFileSync('playwright_logs.txt', logs.join('\n') + '\n\n' + err.stack);
  } finally {
    await browser.close();
  }
})();
