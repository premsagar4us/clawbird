# OpenClaw Integration Guide

This guide explains how to integrate the custom browser driver with OpenClaw.

## Prerequisites

1. OpenClaw installed and running
2. Custom browser driver Phase 1-3 complete
3. Node.js and npm available

## Installation Steps

### Step 1: Copy Plugin to OpenClaw

```bash
# Create plugins directory if it doesn't exist
mkdir -p ~/.openclaw/plugins

# Copy the custom browser driver
cp -r ~/Documents/Custom_browser ~/.openclaw/plugins/custom-browser

# Verify installation
ls -la ~/.openclaw/plugins/custom-browser
```

### Step 2: Configure OpenClaw

Edit `~/.openclaw/openclaw.json` and add:

```json
{
  "browser": {
    "enabled": true,
    "defaultProfile": "custom",
    "profiles": {
      "custom": {
        "driver": "custom",
        "executablePath": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "cdpPort": 19000,
        "userDataDir": "~/.openclaw/browser/custom",
        "color": "#00FF00",
        "customFlags": [
          "--disable-blink-features=AutomationControlled"
        ]
      },
      "custom-brave": {
        "driver": "custom",
        "executablePath": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
        "cdpPort": 19001,
        "userDataDir": "~/.openclaw/browser/custom-brave",
        "color": "#FF6600"
      }
    }
  },
  "plugins": {
    "custom-browser": {
      "enabled": true
    }
  }
}
```

### Step 3: Restart OpenClaw Gateway

```bash
# Stop the gateway
openclaw gateway stop

# Start it again to load the plugin
openclaw gateway start

# Verify it's running
openclaw gateway status
```

## Testing the Integration

### Test 1: CLI Commands

```bash
# Check status
openclaw browser --browser-profile custom status

# Start browser
openclaw browser --browser-profile custom start

# Open a tab
openclaw browser --browser-profile custom open https://example.com

# List tabs
openclaw browser --browser-profile custom tabs

# Take screenshot
openclaw browser --browser-profile custom screenshot

# Get snapshot
openclaw browser --browser-profile custom snapshot

# Stop browser
openclaw browser --browser-profile custom stop
```

### Test 2: Agent Integration

Ask the agent to use your custom browser:

```bash
openclaw agent --message "Use the custom browser to open example.com and take a screenshot"
```

Or via Telegram/WhatsApp:
```
Use custom browser profile to visit wikipedia.org and get the page title
```

### Test 3: Actions

```bash
# Click action (requires element ref from snapshot)
openclaw browser --browser-profile custom act click --ref e42

# Type action
openclaw browser --browser-profile custom act type --ref e23 --text "OpenClaw test"

# Resize viewport
openclaw browser --browser-profile custom act resize --width 1920 --height 1080
```

## API Integration

If OpenClaw exposes a browser control API, you can register your driver programmatically:

```javascript
// In index.js
module.exports = {
  name: 'custom-browser',
  version: '0.2.0',
  
  async init(openclaw) {
    const { CustomBrowserDriver } = require('./driver');
    
    // Register the driver
    if (openclaw.browser && openclaw.browser.registerDriver) {
      openclaw.browser.registerDriver('custom', CustomBrowserDriver);
      console.log('[CustomBrowser Plugin] Driver registered');
    }
    
    // Optional: Set as default profile
    if (openclaw.config) {
      openclaw.config.set('browser.defaultProfile', 'custom');
    }
  }
};
```

## Troubleshooting

### "Browser profile not found"

Make sure the profile name in your config matches what you're using in commands:

```bash
# This should work if profile is named "custom"
openclaw browser --browser-profile custom status
```

### "Driver not registered"

If direct driver registration doesn't work, ensure your profile config includes `"driver": "custom"` and that OpenClaw loads the plugin on startup.

Check gateway logs:
```bash
openclaw logs | grep custom-browser
```

### "CDP connection failed"

1. Check if port is already in use:
   ```bash
   lsof -i :19000
   ```

2. Try a different port in config:
   ```json
   { "cdpPort": 19010 }
   ```

3. Verify browser executable path is correct

### "Actions not working"

Ensure Playwright is installed in the plugin directory:

```bash
cd ~/.openclaw/plugins/custom-browser
npm install
```

## Architecture: How It Works

```
Agent/CLI
    ↓
OpenClaw Browser Tool
    ↓
Browser Control Service (Gateway)
    ↓
Profile Router
    ↓
Custom Browser Driver (your code)
    ↓ ↓
   CDP + Playwright
    ↓
Chrome/Brave
```

### Request Flow Example

1. User: `openclaw browser --browser-profile custom open https://example.com`
2. CLI → Gateway browser control endpoint
3. Gateway → Profile router → Custom driver
4. Custom driver → CDP `/json/new?https%3A%2F%2Fexample.com`
5. Browser opens tab
6. Response: `{ targetId, url, title }`

### Agent Integration Example

1. Agent receives: "Open example.com in custom browser"
2. Agent calls: `browser` tool with `profile="custom"`
3. Tool → Gateway → Custom driver
4. Driver executes: `openTab('https://example.com')`
5. Agent receives: tab info
6. Agent can then: snapshot, screenshot, navigate, act

## Advanced Configuration

### Multiple Profiles

```json
{
  "browser": {
    "profiles": {
      "custom-dev": {
        "driver": "custom",
        "cdpPort": 19000,
        "customFlags": ["--disable-web-security"]
      },
      "custom-prod": {
        "driver": "custom",
        "cdpPort": 19001
      },
      "custom-mobile": {
        "driver": "custom",
        "cdpPort": 19002,
        "customFlags": ["--user-agent=Mobile"]
      }
    }
  }
}
```

### Remote Browser

Point to a remote CDP endpoint:

```json
{
  "browser": {
    "profiles": {
      "custom-remote": {
        "driver": "custom",
        "cdpUrl": "http://192.168.1.100:9222",
        "color": "#0066CC"
      }
    }
  }
}
```

### Custom Download Path

```javascript
// In your driver initialization
const driver = new CustomBrowserDriver();
driver.downloadPath = '/custom/path/to/downloads';
```

## Next Steps

Once integration is working:

1. Test all actions (click, type, hover, etc.)
2. Test snapshots (HTML and ARIA)
3. Test Phase 3 features (console logs, network monitoring)
4. Create example agent workflows
5. Document any custom flags or configurations
6. Share your driver on ClawHub!

## Support

- OpenClaw docs: https://docs.openclaw.ai
- Browser tool docs: `openclaw help browser`
- Plugin system: Check OpenClaw documentation for plugin API

## Example Workflows

### Workflow 1: Automated Testing

```bash
# Start browser
openclaw browser --browser-profile custom start

# Open test page
openclaw browser --browser-profile custom open https://myapp.test

# Setup monitoring
# (console and network capture enabled automatically)

# Run test actions
openclaw browser --browser-profile custom act click --ref loginButton
openclaw browser --browser-profile custom act type --ref username --text "testuser"
openclaw browser --browser-profile custom act type --ref password --text "pass123"
openclaw browser --browser-profile custom act click --ref submitButton

# Wait for result
openclaw browser --browser-profile custom act wait --text "Welcome"

# Capture results
openclaw browser --browser-profile custom screenshot --full-page
openclaw browser --browser-profile custom snapshot

# Get logs
# (via driver API: driver.getConsoleLogs(), driver.getNetworkLogs())
```

### Workflow 2: Web Scraping

```javascript
const driver = new CustomBrowserDriver();

await driver.start({ name: 'scraper', cdpPort: 19050 });
const tab = await driver.openTab('https://example.com');

// Wait for content
await driver.act(tab.targetId, {
  kind: 'wait',
  ref: '#main-content',
  timeMs: 5000
});

// Get snapshot
const snapshot = await driver.snapshot(tab.targetId, { format: 'aria' });

// Extract data via JS
const data = await driver.act(tab.targetId, {
  kind: 'evaluate',
  fn: '() => Array.from(document.querySelectorAll(".item")).map(el => el.textContent)'
});

await driver.stop();
```

---

**Ready to integrate!** Follow the steps above and test each command.
