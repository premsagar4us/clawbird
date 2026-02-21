# 🐦 ClawBird - AI-Powered Browser Automation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Compatible-blue.svg)](https://openclaw.ai)
[![Playwright](https://img.shields.io/badge/Playwright-Core-orange.svg)](https://playwright.dev)

> **The AI-native browser automation engine** — Built for OpenClaw, usable by any AI agent, bot, or automation workflow.

ClawBird is a **production-ready browser automation driver** that bridges the gap between AI assistants and web browsers. Unlike traditional automation tools, it's designed from the ground up for **AI agents** to interact with websites programmatically.

## 🎯 What Makes ClawBird Different

| Feature | Traditional Tools | ClawBird |
|---------|------------------|----------|
| **AI-Native** | ❌ | ✅ Built for LLM agents |
| **OpenClaw Integration** | ❌ | ✅ First-class support |
| **CDP + Playwright** | Pick one | ✅ Both combined |
| **Element References** | XPath/CSS | ✅ AI-friendly aria-refs |
| **No Extension Required** | ❌ | ✅ Standalone browser |
| **Workflow Automation** | Limited | ✅ Job apps, trading, monitoring |

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/premsagar/clawbird.git
cd clawbird

# Install dependencies
npm install

# Start using immediately
node driver.js
```

## 💡 Use Cases

### 🤖 AI Agent Integration
- **OpenClaw Skill**: Seamless integration with OpenClaw personal AI assistant
- **LangChain Tool**: Use as a browser tool in LangChain agents
- **Custom AI Bots**: Power your own AI assistants with web browsing capabilities

### 💼 Job Application Automation
```javascript
// Auto-fill job applications across LinkedIn, Indeed, company sites
const workflow = new JobApplicationWorkflow();
await workflow.applyToJobs({
  keywords: 'software engineer',
  location: 'remote',
  autoFill: true
});
```

### 📊 Price Monitoring & Trading
```javascript
// Monitor prices, stocks, crypto in real-time
const monitor = new PriceMonitor();
await monitor.watch({
  urls: ['amazon.com/product', 'ebay.com/item'],
  alertOnChange: true,
  screenshot: true
});
```

### 📰 News Aggregation
```javascript
// AI-powered news monitoring and summarization
const news = new NewsAggregator();
const headlines = await news.fetchFrom([
  'techcrunch.com',
  'hackernews.com',
  'reddit.com/r/programming'
]);
```

### 🧪 Web Scraping & Data Extraction
```javascript
// Extract structured data from any website
const data = await driver.extract({
  url: 'example.com/products',
  schema: {
    name: '.product-title',
    price: '.product-price',
    image: '.product-img@src'
  }
});
```

### 📸 Visual Documentation
```javascript
// Automated screenshots for documentation
const docs = new ScreenshotDocumenter();
await docs.captureSiteMap('https://docs.openclaw.ai');
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AI Agent / OpenClaw                   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  ClawBird Driver                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   CDP Layer  │  │  Playwright  │  │   Actions    │  │
│  │  (Chrome     │  │   (Advanced  │  │   (Click,    │  │
│  │   DevTools)  │  │    Actions)  │  │   Type, etc) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Chrome / Brave / Edge                       │
└─────────────────────────────────────────────────────────┘
```

## 📦 Installation

### As OpenClaw Plugin

```bash
# Install to OpenClaw plugins
mkdir -p ~/.openclaw/plugins
cp -r clawbird ~/.openclaw/plugins/custom-browser

# Configure OpenClaw
cat >> ~/.openclaw/openclaw.json << 'EOF'
{
  "browser": {
    "profiles": {
      "custom": {
        "driver": "custom",
        "executablePath": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "cdpPort": 19000,
        "userDataDir": "~/.openclaw/browser/custom"
      }
    }
  }
}
EOF

openclaw gateway restart
```

### As Standalone Library

```bash
npm install clawbird
```

```javascript
const { ClawBird } = require('clawbird');

const browser = new ClawBird();
await browser.start();
const page = await browser.open('https://example.com');
await page.screenshot({ path: 'example.png' });
await browser.stop();
```

## 🔧 Features

### Core Capabilities
- ✅ **Browser Lifecycle**: Start, stop, manage browser instances
- ✅ **Tab Management**: List, open, close, focus tabs
- ✅ **Navigation**: Navigate to URLs with wait conditions
- ✅ **Screenshots**: Full page, element, or viewport captures
- ✅ **Snapshots**: HTML source and ARIA accessibility tree

### Advanced Actions (Powered by Playwright)
- ✅ **Click**: Single, double, with modifiers (Ctrl, Shift, Alt)
- ✅ **Type**: Fill text inputs, submit forms
- ✅ **Keyboard**: Press any key or key combination
- ✅ **Hover**: Mouse hover with precise positioning
- ✅ **Drag & Drop**: Inter-element dragging
- ✅ **Select**: Dropdown and multi-select handling
- ✅ **Form Fill**: Batch form population
- ✅ **Resize**: Viewport and window resizing
- ✅ **Wait**: Time-based, element, or text conditions
- ✅ **Upload**: File upload automation
- ✅ **Download**: File download monitoring

### AI-Friendly Features
- ✅ **Element References**: ARIA-based refs (e12, e34) instead of fragile XPath
- ✅ **Accessibility Tree**: Structured page representation for AI parsing
- ✅ **Smart Waiting**: Auto-wait for elements before interaction
- ✅ **Error Recovery**: Automatic retry and fallback mechanisms

### Monitoring & Debugging
- ✅ **Console Logs**: Capture browser console output
- ✅ **Network Monitoring**: Track requests and responses
- ✅ **Device Emulation**: Mobile, tablet, custom viewports
- ✅ **Geolocation**: Override location and timezone

## 🎮 API Reference

### Basic Usage

```javascript
const driver = new CustomBrowserDriver();

// Start browser
await driver.start({
  name: 'my-profile',
  executablePath: '/path/to/chrome',
  cdpPort: 19000
});

// Open a page
const tab = await driver.open('https://example.com');

// Take screenshot
await driver.screenshot(tab.targetId, { path: 'screenshot.png' });

// Perform actions
await driver.act(tab.targetId, {
  kind: 'click',
  ref: 'e12'  // AI-friendly element reference
});

// Get page snapshot
const snapshot = await driver.snapshot(tab.targetId);

// Stop browser
await driver.stop();
```

### Workflow Automation

```javascript
const { WorkflowRunner } = require('clawbird/workflows');

const runner = new WorkflowRunner();

// Define a workflow
const workflow = {
  name: 'Job Application',
  steps: [
    { action: 'navigate', url: 'https://linkedin.com/jobs' },
    { action: 'type', selector: '[name="keywords"]', text: 'Software Engineer' },
    { action: 'click', selector: 'button[type="submit"]' },
    { action: 'screenshot', name: 'search-results' }
  ]
};

// Execute
await runner.run(workflow);
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:actions      # Playwright action tests
npm run test:complete     # Full integration tests
npm run test:workflows    # Workflow automation tests
```

## 📁 Project Structure

```
clawbird/
├── driver.js              # Core browser driver (CDP + Playwright)
├── index.js               # OpenClaw plugin entry point
├── package.json           # Dependencies and scripts
├── config-example.json    # Configuration template
├── workflows/             # Pre-built automation workflows
│   ├── price-monitor.js   # Price tracking automation
│   ├── news-aggregator.js # News monitoring
│   ├── form-filler.js     # Form automation
│   └── screenshot-documenter.js  # Visual documentation
├── test*.js               # Test suites
└── README.md              # This file
```

## 🔗 Integrations

### OpenClaw
```javascript
// In OpenClaw agent
const browser = await openclaw.browser.start('custom');
await browser.open('https://example.com');
```

### LangChain
```javascript
// As a LangChain tool
const tool = new ClawBirdTool();
const result = await tool.invoke({
  action: 'search',
  query: 'latest AI news'
});
```

### Custom AI Agents
```javascript
// Direct integration
const driver = new CustomBrowserDriver();
// Use in your agent's toolset
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
git clone https://github.com/premsagar/clawbird.git
cd clawbird
npm install
npm run dev
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Playwright](https://playwright.dev/) - Reliable browser automation
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) - Low-level browser control
- [OpenClaw](https://openclaw.ai/) - Personal AI assistant framework
- [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface) - CDP client

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=premsagar/clawbird&type=Date)](https://star-history.com/#premsagar/clawbird&Date)

---

## 💬 Keywords for AI Discovery

`browser automation` `ai agent` `openclaw` `playwright` `chrome devtools` `cdp` `web scraping` `job automation` `price monitoring` `trading bot` `form filler` `screenshot automation` `ai assistant` `llm tool` `langchain` `puppeteer alternative` `selenium alternative` `web testing` `e2e testing` `headless browser` `browser driver` `automation framework` `rpa` `robotic process automation` `ai-native` `agentic ai`

---

<p align="center">
  <b>Built with ⚡ by Premsagar</b><br>
  <a href="https://github.com/premsagar">GitHub</a> •
  <a href="https://openclaw.ai">OpenClaw</a>
</p>
