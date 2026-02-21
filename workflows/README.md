# Browser Automation Workflows

Real-world automation workflows built with the custom browser driver.

---

## 📚 What Are Workflows?

**Workflows** are automated browser scripts that perform real tasks:
- ✅ **Save time** - Automate repetitive manual work
- ✅ **Monitor changes** - Track prices, news, updates
- ✅ **Extract data** - Scrape websites at scale
- ✅ **Test applications** - Automated QA testing
- ✅ **Document** - Capture screenshots for records

---

## 🛠️ Available Workflows

### 1. Price Monitor (`price-monitor.js`)
**What it does:** Tracks product prices and alerts on price drops

**Use cases:**
- Monitor Amazon/eBay prices
- Track cryptocurrency prices
- Watch stock prices
- Alert on deals

**Run it:**
```bash
node workflows/price-monitor.js
```

**Output:**
- Price history (JSON)
- Screenshots of products
- Alert on price drops

---

### 2. News Aggregator (`news-aggregator.js`)
**What it does:** Visits news sites and compiles headlines

**Use cases:**
- Daily news digest
- Industry-specific news monitoring
- Competitor tracking
- Research compilation

**Run it:**
```bash
node workflows/news-aggregator.js
```

**Output:**
- HTML report with headlines
- Screenshots of sources
- Clickable links to articles

---

### 3. Screenshot Documenter (`screenshot-documenter.js`)
**What it does:** Captures responsive screenshots (mobile/tablet/desktop)

**Use cases:**
- Website documentation
- Before/after comparisons
- Design review
- Client presentations
- Bug reporting

**Run it:**
```bash
node workflows/screenshot-documenter.js
```

**Output:**
- Screenshots at multiple viewports
- HTML index with all screenshots
- Organized by page

---

### 4. Form Filler (`form-filler.js`)
**What it does:** Auto-fills forms with saved data

**Use cases:**
- Job applications
- Contact forms
- Survey responses
- Repetitive data entry

**Run it:**
```bash
node workflows/form-filler.js
```

**Output:**
- Filled forms (not submitted)
- Screenshots for verification
- Batch processing support

---

## 🎯 How to Use

### Step 1: Choose a Workflow
Pick the workflow that fits your need.

### Step 2: Customize the Config
Edit the workflow file to add your URLs and selectors:

```javascript
// Example: Add your own products to price-monitor.js
const products = [
  {
    name: 'iPhone 15',
    url: 'https://www.amazon.com/...',
    selector: '.a-price-whole'
  },
  {
    name: 'MacBook Pro',
    url: 'https://www.apple.com/...',
    selector: '#price'
  }
];
```

### Step 3: Run It
```bash
cd ~/Documents/Custom_browser
node workflows/price-monitor.js
```

### Step 4: Schedule It (Optional)
Use cron to run automatically:

```bash
# Run price monitor every day at 9 AM
0 9 * * * cd ~/Documents/Custom_browser && node workflows/price-monitor.js
```

---

## 💡 Creating Your Own Workflow

### Template:

```javascript
#!/usr/bin/env node
const { CustomBrowserDriver } = require('../driver');

class MyWorkflow {
  constructor() {
    this.driver = new CustomBrowserDriver();
  }

  async run() {
    // 1. Start browser
    await this.driver.start({
      name: 'my-workflow',
      cdpPort: 19200
    });

    // 2. Open page
    const tab = await this.driver.openTab('https://example.com');

    // 3. Wait for content
    await this.driver.act(tab.targetId, {
      kind: 'wait',
      timeMs: 2000
    });

    // 4. Do something (extract data, fill form, etc.)
    const data = await this.driver.act(tab.targetId, {
      kind: 'evaluate',
      fn: '() => document.title'
    });

    console.log('Result:', data);

    // 5. Cleanup
    await this.driver.closeTab(tab.targetId);
    await this.driver.stop();
  }
}

// Run
new MyWorkflow().run().catch(console.error);
```

---

## 🔧 Common Patterns

### Pattern 1: Extract Data
```javascript
const data = await driver.act(tab.targetId, {
  kind: 'evaluate',
  fn: `() => {
    return Array.from(document.querySelectorAll('.item'))
      .map(el => ({
        title: el.querySelector('.title')?.textContent,
        price: el.querySelector('.price')?.textContent
      }));
  }`
});
```

### Pattern 2: Fill Form
```javascript
await driver.act(tab.targetId, {
  kind: 'type',
  ref: 'input[name="email"]',
  text: 'user@example.com'
});

await driver.act(tab.targetId, {
  kind: 'click',
  ref: 'button[type="submit"]'
});
```

### Pattern 3: Wait for Element
```javascript
await driver.act(tab.targetId, {
  kind: 'wait',
  ref: '#results',
  timeMs: 10000
});
```

### Pattern 4: Take Screenshot
```javascript
const screenshot = await driver.screenshot(tab.targetId);
fs.writeFileSync('/tmp/screenshot.png', screenshot);
```

---

## 📊 Workflow Ideas

### Business
- Lead generation (scrape directories)
- Competitor monitoring
- Market research
- Email campaign validation

### Personal
- Job application automation
- Price drop alerts
- News monitoring
- Social media scheduling

### Development
- Automated testing
- Performance monitoring
- Screenshot testing
- Link checking

### Content
- Content aggregation
- Social media monitoring
- Trend tracking
- Archive creation

---

## ⚙️ Configuration Tips

### 1. Use Environment Variables
```javascript
const API_KEY = process.env.MY_API_KEY;
```

### 2. Store Data in JSON
```javascript
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
```

### 3. Handle Errors
```javascript
try {
  await workflow.run();
} catch (error) {
  console.error('Workflow failed:', error);
  // Send alert, log to file, etc.
}
```

### 4. Add Logging
```javascript
console.log(`[${new Date().toISOString()}] Starting workflow...`);
```

---

## 🔒 Best Practices

### 1. Respect robots.txt
Check website's robots.txt before scraping

### 2. Add Delays
Don't overwhelm servers:
```javascript
await driver.act(tab.targetId, { kind: 'wait', timeMs: 2000 });
```

### 3. Handle Rate Limiting
Implement exponential backoff on failures

### 4. Don't Submit Forms Automatically
Always review before submitting

### 5. Store Credentials Securely
Use environment variables, not hardcoded strings

---

## 📝 Output Examples

### Price Monitor Output:
```
🔍 Price Monitor - Checking 2 products...

📊 iPhone 15
   URL: https://www.amazon.com/...
   Current Price: $799
   🎉 PRICE DROP! Was $899, now $799
   💰 You save: $100
   Screenshot: /tmp/price-monitor-1234.png

✅ Monitoring complete!
```

### News Aggregator Output:
```
📡 News Aggregator - Collecting from 3 sources...

📰 Visiting: https://techcrunch.com
   ✓ Found 10 headlines
   
📄 Report saved: /tmp/news-report-1234.html
📊 Total headlines: 30
```

---

## 🚀 Advanced: Scheduling with Cron

Create a cron job to run workflows automatically:

```bash
# Edit crontab
crontab -e

# Add jobs (examples):
# Price monitor every day at 9 AM
0 9 * * * cd ~/Documents/Custom_browser && node workflows/price-monitor.js >> /tmp/price-monitor.log 2>&1

# News aggregator every 6 hours
0 */6 * * * cd ~/Documents/Custom_browser && node workflows/news-aggregator.js

# Screenshot documenter every Monday at 2 AM
0 2 * * 1 cd ~/Documents/Custom_browser && node workflows/screenshot-documenter.js
```

---

## 📚 Resources

- **Driver Documentation:** `../README.md`
- **API Reference:** `../driver.js` (see JSDoc comments)
- **Test Examples:** `../test-*.js`

---

## 🤝 Contributing

Have a useful workflow? Share it!

1. Create your workflow file
2. Add documentation
3. Share with the community

---

**Happy Automating! 🤖**
