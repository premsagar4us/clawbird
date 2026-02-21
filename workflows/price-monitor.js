#!/usr/bin/env node
/**
 * Price Monitor Workflow
 * Checks product prices on websites and alerts on price drops
 */

const { CustomBrowserDriver } = require('../driver');
const fs = require('fs');

class PriceMonitor {
  constructor() {
    this.driver = new CustomBrowserDriver();
    this.dataFile = '/tmp/price-monitor-data.json';
  }

  /**
   * Load historical price data
   */
  loadHistory() {
    if (fs.existsSync(this.dataFile)) {
      return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
    }
    return {};
  }

  /**
   * Save price data
   */
  saveHistory(data) {
    fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
  }

  /**
   * Check price on a website
   */
  async checkPrice(url, priceSelector) {
    console.log(`[PriceMonitor] Checking price at: ${url}`);
    
    const tab = await this.driver.openTab(url);
    
    // Wait for page to load
    await this.driver.act(tab.targetId, {
      kind: 'wait',
      timeMs: 3000
    });

    // Extract price using JavaScript
    const price = await this.driver.act(tab.targetId, {
      kind: 'evaluate',
      fn: `(selector) => {
        const el = document.querySelector(selector || 'body');
        const text = el ? el.textContent : 'N/A';
        const match = text.match(/\\$?([0-9,]+\\.?[0-9]*)/);
        return match ? parseFloat(match[1].replace(/,/g, '')) : null;
      }`
    });

    // Take screenshot
    const screenshot = await this.driver.screenshot(tab.targetId);
    const screenshotPath = `/tmp/price-monitor-${Date.now()}.png`;
    fs.writeFileSync(screenshotPath, screenshot);

    await this.driver.closeTab(tab.targetId);

    return {
      url,
      price,
      timestamp: new Date().toISOString(),
      screenshot: screenshotPath
    };
  }

  /**
   * Monitor multiple products
   */
  async monitor(products) {
    console.log(`\n🔍 Price Monitor - Checking ${products.length} products...\n`);

    await this.driver.start({
      name: 'price-monitor',
      cdpPort: 19100
    });

    const history = this.loadHistory();
    const results = [];

    for (const product of products) {
      try {
        const result = await this.checkPrice(product.url, product.selector);
        
        console.log(`\n📊 ${product.name}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Current Price: $${result.price || 'N/A'}`);

        // Check for price drop
        const previousPrice = history[product.url]?.price;
        if (previousPrice && result.price && result.price < previousPrice) {
          const savings = (previousPrice - result.price).toFixed(2);
          console.log(`   🎉 PRICE DROP! Was $${previousPrice}, now $${result.price}`);
          console.log(`   💰 You save: $${savings}`);
          result.alert = `Price dropped by $${savings}`;
        } else if (previousPrice) {
          console.log(`   Previous: $${previousPrice}`);
        }

        console.log(`   Screenshot: ${result.screenshot}`);

        // Save to history
        history[product.url] = result;
        results.push(result);

      } catch (error) {
        console.error(`   ❌ Error checking ${product.name}:`, error.message);
      }
    }

    this.saveHistory(history);
    await this.driver.stop();

    console.log(`\n✅ Monitoring complete! Checked ${products.length} products.\n`);
    
    return results;
  }
}

// Example usage
async function main() {
  const monitor = new PriceMonitor();

  const products = [
    {
      name: 'Example Product',
      url: 'https://example.com',
      selector: 'body' // In real use, target specific price element
    },
    // Add more products here
    // {
    //   name: 'iPhone 15',
    //   url: 'https://www.amazon.com/...',
    //   selector: '.a-price-whole'
    // }
  ];

  await monitor.monitor(products);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PriceMonitor };
