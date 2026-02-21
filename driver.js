/**
 * Custom Browser Driver for OpenClaw
 * Implements the BrowserDriver interface for custom browser automation
 */

const CDP = require('chrome-remote-interface');
const { spawn } = require('child_process');
const { promisify } = require('util');
const { chromium } = require('playwright-core');
const sleep = promisify(setTimeout);

class CustomBrowserDriver {
  constructor() {
    this.proc = null;
    this.client = null;
    this.profile = null;
    this.tabs = new Map(); // targetId -> tab info
    this.playwrightBrowser = null;
    this.playwrightPages = new Map(); // targetId -> Playwright Page
    this.consoleLogs = new Map(); // targetId -> array of console messages
    this.networkLogs = new Map(); // targetId -> array of network requests
    this.downloadPath = '/tmp/openclaw/downloads';
  }

  /**
   * Start the browser with given profile configuration
   * @param {Object} profile - Profile configuration
   * @returns {Promise<void>}
   */
  async start(profile) {
    console.log('[CustomDriver] Starting browser with profile:', profile.name);
    this.profile = profile;

    // Default browser path - override in profile config
    const browserPath = profile.executablePath || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const cdpPort = profile.cdpPort || 19000;
    const userDataDir = profile.userDataDir || `${process.env.HOME}/.openclaw/browser/${profile.name}`;

    // Browser launch flags
    const browserArgs = [
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      // Custom flags
      ...(profile.customFlags || [])
    ];

    console.log('[CustomDriver] Launching:', browserPath);
    console.log('[CustomDriver] Args:', browserArgs);

    // Spawn browser process
    this.proc = spawn(browserPath, browserArgs, {
      detached: false,
      stdio: 'ignore'
    });

    this.proc.on('error', (err) => {
      console.error('[CustomDriver] Browser process error:', err);
    });

    this.proc.on('exit', (code) => {
      console.log(`[CustomDriver] Browser process exited with code ${code}`);
    });

    // Wait for CDP to be ready
    console.log('[CustomDriver] Waiting for CDP...');
    await sleep(3000);

    // Connect to CDP
    try {
      this.client = await CDP({ port: cdpPort });
      console.log('[CustomDriver] CDP connected');

      // Enable necessary domains
      await Promise.all([
        this.client.Page.enable(),
        this.client.Runtime.enable(),
        this.client.Network.enable(),
        this.client.DOM.enable()
      ]);

      // Connect Playwright to the same CDP endpoint
      console.log('[CustomDriver] Connecting Playwright...');
      try {
        this.playwrightBrowser = await chromium.connectOverCDP(`http://localhost:${cdpPort}`);
        console.log('[CustomDriver] Playwright connected');
      } catch (err) {
        console.warn('[CustomDriver] Playwright connection failed:', err.message);
        console.warn('[CustomDriver] Actions will not be available');
      }

      console.log('[CustomDriver] Browser started successfully');
    } catch (error) {
      console.error('[CustomDriver] Failed to connect to CDP:', error.message);
      this.stop();
      throw error;
    }
  }

  /**
   * Stop the browser
   * @returns {Promise<void>}
   */
  async stop() {
    console.log('[CustomDriver] Stopping browser...');
    
    // Close Playwright connections
    if (this.playwrightBrowser) {
      try {
        await this.playwrightBrowser.close();
      } catch (err) {
        console.warn('[CustomDriver] Error closing Playwright browser:', err.message);
      }
      this.playwrightBrowser = null;
    }
    
    this.playwrightPages.clear();
    
    if (this.client) {
      try {
        await this.client.close();
      } catch (err) {
        console.warn('[CustomDriver] Error closing CDP client:', err.message);
      }
      this.client = null;
    }

    if (this.proc) {
      this.proc.kill('SIGTERM');
      this.proc = null;
    }

    this.tabs.clear();
    console.log('[CustomDriver] Browser stopped');
  }

  /**
   * Get browser status
   * @returns {Promise<Object>}
   */
  async status() {
    const running = this.client !== null && this.proc !== null;
    return {
      running,
      profile: this.profile?.name || null,
      cdpPort: this.profile?.cdpPort || null,
      tabCount: this.tabs.size
    };
  }

  /**
   * List all open tabs
   * @returns {Promise<Array>}
   */
  async listTabs() {
    if (!this.client) {
      throw new Error('Browser not running');
    }

    try {
      // Use CDP HTTP endpoint to list tabs
      const http = require('http');
      const port = this.profile.cdpPort;
      
      return new Promise((resolve, reject) => {
        http.get(`http://localhost:${port}/json/list`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const targets = JSON.parse(data);
              const tabs = targets
                .filter(t => t.type === 'page')
                .map(t => ({
                  targetId: t.id,
                  title: t.title,
                  url: t.url,
                  webSocketDebuggerUrl: t.webSocketDebuggerUrl
                }));
              
              // Update internal tabs map
              for (const tab of tabs) {
                this.tabs.set(tab.targetId, tab);
              }
              
              resolve(tabs);
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', reject);
      });
    } catch (error) {
      console.error('[CustomDriver] Error listing tabs:', error.message);
      return [];
    }
  }

  /**
   * Open a new tab with given URL
   * @param {string} url - URL to open
   * @returns {Promise<Object>}
   */
  async openTab(url) {
    if (!this.client) {
      throw new Error('Browser not running');
    }

    console.log('[CustomDriver] Opening tab:', url);
    
    // Use CDP HTTP endpoint to create new tab
    const http = require('http');
    const port = this.profile.cdpPort;
    const encodedUrl = encodeURIComponent(url);
    
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: port,
        path: `/json/new?${encodedUrl}`,
        method: 'PUT'
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const target = JSON.parse(data);
            const tab = {
              targetId: target.id,
              url: target.url,
              title: target.title || 'Loading...'
            };
            
            this.tabs.set(tab.targetId, tab);
            resolve(tab);
          } catch (e) {
            console.error('[CustomDriver] Failed to parse response:', data.substring(0, 200));
            reject(new Error(`Failed to parse CDP response: ${e.message}`));
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Focus a tab by targetId
   * @param {string} targetId - Target ID
   * @returns {Promise<void>}
   */
  async focusTab(targetId) {
    if (!this.client) {
      throw new Error('Browser not running');
    }

    console.log('[CustomDriver] Focusing tab:', targetId);
    
    // Use CDP HTTP endpoint to activate tab
    const http = require('http');
    const port = this.profile.cdpPort;
    
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/json/activate/${targetId}`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Failed to activate tab: ${res.statusCode}`));
        }
      }).on('error', reject);
    });
  }

  /**
   * Close a tab by targetId
   * @param {string} targetId - Target ID
   * @returns {Promise<void>}
   */
  async closeTab(targetId) {
    if (!this.client) {
      throw new Error('Browser not running');
    }

    console.log('[CustomDriver] Closing tab:', targetId);
    
    // Use CDP HTTP endpoint to close tab
    const http = require('http');
    const port = this.profile.cdpPort;
    
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}/json/close/${targetId}`, (res) => {
        if (res.statusCode === 200) {
          this.tabs.delete(targetId);
          resolve();
        } else {
          reject(new Error(`Failed to close tab: ${res.statusCode}`));
        }
      }).on('error', reject);
    });
  }

  /**
   * Navigate to URL in specified tab
   * @param {string} targetId - Target ID
   * @param {string} url - URL to navigate to
   * @returns {Promise<void>}
   */
  async navigate(targetId, url) {
    if (!this.client) {
      throw new Error('Browser not running');
    }

    console.log('[CustomDriver] Navigating to:', url);
    
    try {
      // Use Playwright for navigation if available (more robust)
      if (this.playwrightBrowser) {
        const page = await this.getPlaywrightPage(targetId);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log('[CustomDriver] ✓ Navigation complete (Playwright)');
      } else {
        // Fallback to CDP
        await this.client.Page.navigate({ url });
        await sleep(2000);
        console.log('[CustomDriver] ✓ Navigation complete (CDP)');
      }
    } catch (error) {
      console.error('[CustomDriver] Navigation failed:', error.message);
      throw error;
    }
  }

  /**
   * Take screenshot of current tab
   * @param {string} targetId - Target ID
   * @param {Object} options - Screenshot options
   * @returns {Promise<Buffer>}
   */
  async screenshot(targetId, options = {}) {
    if (!this.client) {
      throw new Error('Browser not running');
    }

    console.log('[CustomDriver] Taking screenshot of:', targetId);

    const { data } = await this.client.Page.captureScreenshot({
      format: options.format || 'png',
      quality: options.quality || 90,
      fromSurface: true,
      captureBeyondViewport: options.fullPage || false
    });

    return Buffer.from(data, 'base64');
  }

  /**
   * Get Playwright page for a given target
   * @param {string} targetId - Target ID
   * @returns {Promise<Page>}
   */
  async getPlaywrightPage(targetId) {
    if (!this.playwrightBrowser) {
      throw new Error('Playwright not connected. Actions require Playwright.');
    }

    // Check if we already have a page reference
    if (this.playwrightPages.has(targetId)) {
      const page = this.playwrightPages.get(targetId);
      // Verify page is still valid
      if (!page.isClosed()) {
        return page;
      } else {
        this.playwrightPages.delete(targetId);
      }
    }

    // Wait a moment for Playwright to pick up the new tab
    await sleep(500);

    // Find the page in Playwright's context
    const contexts = this.playwrightBrowser.contexts();
    for (const context of contexts) {
      const pages = context.pages();
      
      // Try URL matching first (most reliable for newly opened tabs)
      const tab = this.tabs.get(targetId);
      if (tab) {
        for (const page of pages) {
          if (page.url() === tab.url) {
            this.playwrightPages.set(targetId, page);
            return page;
          }
        }
      }
      
      // If only one page and no mapping yet, use it
      if (pages.length === 1 && this.playwrightPages.size === 0) {
        const page = pages[0];
        this.playwrightPages.set(targetId, page);
        return page;
      }
      
      // Try to match the most recently created page
      if (pages.length > 0) {
        const page = pages[pages.length - 1];
        if (!Array.from(this.playwrightPages.values()).includes(page)) {
          this.playwrightPages.set(targetId, page);
          return page;
        }
      }
    }

    throw new Error(`No Playwright page found for target ${targetId}. Open a tab first.`);
  }

  /**
   * Get page snapshot (simplified version)
   * @param {string} targetId - Target ID
   * @param {Object} options - Snapshot options
   * @returns {Promise<Object>}
   */
  async snapshot(targetId, options = {}) {
    if (!this.client) {
      throw new Error('Browser not running');
    }

    console.log('[CustomDriver] Getting snapshot of:', targetId);

    // ARIA snapshot (Playwright required)
    if (options.format === 'aria' && this.playwrightBrowser) {
      try {
        const page = await this.getPlaywrightPage(targetId);
        // Get accessibility tree from Playwright
        const snapshot = await page.accessibility.snapshot();
        return {
          format: 'aria',
          snapshot: JSON.stringify(snapshot, null, 2),
          url: await page.url()
        };
      } catch (err) {
        console.warn('[CustomDriver] ARIA snapshot failed:', err.message);
        // Fall back to HTML
      }
    }

    // HTML snapshot (CDP fallback)
    const { root } = await this.client.DOM.getDocument({ depth: -1 });
    const { outerHTML } = await this.client.DOM.getOuterHTML({ nodeId: root.nodeId });

    return {
      format: 'html',
      html: outerHTML,
      url: this.tabs.get(targetId)?.url || 'unknown'
    };
  }

  /**
   * Get cookies
   * @param {string} targetId - Target ID
   * @returns {Promise<Array>}
   */
  async getCookies(targetId) {
    if (!this.client) {
      throw new Error('Browser not running');
    }

    const { cookies } = await this.client.Network.getCookies();
    return cookies;
  }

  /**
   * Set cookie
   * @param {string} targetId - Target ID
   * @param {Object} cookie - Cookie object
   * @returns {Promise<void>}
   */
  async setCookie(targetId, cookie) {
    if (!this.client) {
      throw new Error('Browser not running');
    }

    await this.client.Network.setCookie(cookie);
  }

  /**
   * Evaluate JavaScript in page context
   * @param {string} targetId - Target ID
   * @param {string} expression - JavaScript expression
   * @returns {Promise<any>}
   */
  async evaluate(targetId, expression) {
    if (!this.client) {
      throw new Error('Browser not running');
    }

    console.log('[CustomDriver] Evaluating:', expression);

    const { result } = await this.client.Runtime.evaluate({
      expression,
      returnByValue: true
    });

    return result.value;
  }

  /**
   * Perform action (click/type/etc) using Playwright
   * @param {string} targetId - Target ID
   * @param {Object} action - Action object with { kind, ref, text, key, ... }
   * @returns {Promise<void>}
   */
  async act(targetId, action) {
    if (!this.playwrightBrowser) {
      throw new Error('Actions require Playwright. Playwright not connected.');
    }

    console.log('[CustomDriver] Performing action:', action.kind, 'on ref:', action.ref);

    const page = await this.getPlaywrightPage(targetId);
    
    // Get element by ref (assuming aria-ref or CSS selector)
    let locator;
    if (action.ref) {
      // Try aria-ref first (numeric refs like "12")
      if (/^\d+$/.test(action.ref)) {
        locator = page.locator(`[aria-ref="${action.ref}"]`);
      } else if (action.ref.startsWith('e')) {
        // Role-based ref like "e12"
        // This would need proper role mapping; simplified for now
        locator = page.locator(`[ref="${action.ref}"]`);
      } else {
        // Treat as CSS selector fallback
        locator = page.locator(action.ref);
      }
    }

    switch (action.kind) {
      case 'click':
        if (!locator) throw new Error('Click action requires ref');
        await locator.click({
          button: action.button || 'left',
          clickCount: action.doubleClick ? 2 : 1,
          modifiers: action.modifiers || []
        });
        console.log('[CustomDriver] ✓ Clicked');
        break;

      case 'type':
        if (!locator) throw new Error('Type action requires ref');
        await locator.fill(action.text || '');
        if (action.submit) {
          await locator.press('Enter');
        }
        console.log('[CustomDriver] ✓ Typed:', action.text);
        break;

      case 'press':
        if (action.key) {
          await page.keyboard.press(action.key, {
            delay: action.slowly ? 100 : undefined
          });
        }
        console.log('[CustomDriver] ✓ Pressed key:', action.key);
        break;

      case 'hover':
        if (!locator) throw new Error('Hover action requires ref');
        await locator.hover();
        console.log('[CustomDriver] ✓ Hovered');
        break;

      case 'drag':
        if (!action.startRef || !action.endRef) {
          throw new Error('Drag action requires startRef and endRef');
        }
        const startLoc = page.locator(`[aria-ref="${action.startRef}"]`);
        const endLoc = page.locator(`[aria-ref="${action.endRef}"]`);
        await startLoc.dragTo(endLoc);
        console.log('[CustomDriver] ✓ Dragged');
        break;

      case 'select':
        if (!locator) throw new Error('Select action requires ref');
        await locator.selectOption(action.values || []);
        console.log('[CustomDriver] ✓ Selected:', action.values);
        break;

      case 'fill':
        // Batch form filling
        if (action.fields && Array.isArray(action.fields)) {
          for (const field of action.fields) {
            const fieldLoc = page.locator(`[aria-ref="${field.ref}"]`);
            await fieldLoc.fill(field.value || '');
          }
          console.log('[CustomDriver] ✓ Filled', action.fields.length, 'fields');
        }
        break;

      case 'wait':
        // Wait for various conditions
        if (action.text) {
          await page.waitForSelector(`text=${action.text}`, {
            timeout: action.timeMs || 30000
          });
          console.log('[CustomDriver] ✓ Waited for text:', action.text);
        } else if (action.ref) {
          await locator.waitFor({ timeout: action.timeMs || 30000 });
          console.log('[CustomDriver] ✓ Waited for element');
        } else if (action.timeMs) {
          await sleep(action.timeMs);
          console.log('[CustomDriver] ✓ Waited', action.timeMs, 'ms');
        }
        break;

      case 'resize':
        await page.setViewportSize({
          width: action.width || 1280,
          height: action.height || 720
        });
        console.log('[CustomDriver] ✓ Resized viewport');
        break;

      case 'evaluate':
        if (!action.fn) throw new Error('Evaluate requires fn');
        // Support both string function and actual function
        let evalFn = action.fn;
        if (typeof evalFn === 'string') {
          // If it's a string like "() => document.title", evaluate it
          evalFn = eval(`(${evalFn})`);
        }
        const result = await page.evaluate(evalFn);
        console.log('[CustomDriver] ✓ Evaluated, result:', result);
        return result;

      case 'close':
        await page.close();
        this.playwrightPages.delete(targetId);
        console.log('[CustomDriver] ✓ Closed page');
        break;

      default:
        throw new Error(`Unknown action kind: ${action.kind}`);
    }
  }

  /**
   * Setup console log capture for a page
   * @param {string} targetId - Target ID
   * @returns {Promise<void>}
   */
  async setupConsoleCapture(targetId) {
    if (!this.playwrightBrowser) return;

    try {
      const page = await this.getPlaywrightPage(targetId);
      
      if (!this.consoleLogs.has(targetId)) {
        this.consoleLogs.set(targetId, []);
      }

      page.on('console', msg => {
        this.consoleLogs.get(targetId).push({
          type: msg.type(),
          text: msg.text(),
          timestamp: Date.now()
        });
      });

      console.log('[CustomDriver] Console capture enabled for', targetId);
    } catch (err) {
      console.warn('[CustomDriver] Console capture setup failed:', err.message);
    }
  }

  /**
   * Get console logs for a page
   * @param {string} targetId - Target ID
   * @param {Object} options - Options like level filter
   * @returns {Promise<Array>}
   */
  async getConsoleLogs(targetId, options = {}) {
    const logs = this.consoleLogs.get(targetId) || [];
    
    if (options.level) {
      return logs.filter(log => log.type === options.level);
    }
    
    return logs;
  }

  /**
   * Clear console logs for a page
   * @param {string} targetId - Target ID
   * @returns {Promise<void>}
   */
  async clearConsoleLogs(targetId) {
    this.consoleLogs.set(targetId, []);
    console.log('[CustomDriver] Console logs cleared for', targetId);
  }

  /**
   * Setup network request monitoring
   * @param {string} targetId - Target ID
   * @returns {Promise<void>}
   */
  async setupNetworkMonitoring(targetId) {
    if (!this.playwrightBrowser) return;

    try {
      const page = await this.getPlaywrightPage(targetId);
      
      if (!this.networkLogs.has(targetId)) {
        this.networkLogs.set(targetId, []);
      }

      page.on('request', request => {
        this.networkLogs.get(targetId).push({
          type: 'request',
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      });

      page.on('response', response => {
        this.networkLogs.get(targetId).push({
          type: 'response',
          url: response.url(),
          status: response.status(),
          timestamp: Date.now()
        });
      });

      console.log('[CustomDriver] Network monitoring enabled for', targetId);
    } catch (err) {
      console.warn('[CustomDriver] Network monitoring setup failed:', err.message);
    }
  }

  /**
   * Get network logs
   * @param {string} targetId - Target ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>}
   */
  async getNetworkLogs(targetId, options = {}) {
    const logs = this.networkLogs.get(targetId) || [];
    
    if (options.filter) {
      return logs.filter(log => log.url.includes(options.filter));
    }
    
    return logs;
  }

  /**
   * Clear network logs
   * @param {string} targetId - Target ID
   * @returns {Promise<void>}
   */
  async clearNetworkLogs(targetId) {
    this.networkLogs.set(targetId, []);
    console.log('[CustomDriver] Network logs cleared for', targetId);
  }

  /**
   * Setup file upload (arm file chooser)
   * @param {string} targetId - Target ID
   * @param {Array<string>} filePaths - Paths to files
   * @returns {Promise<void>}
   */
  async setupFileUpload(targetId, filePaths) {
    if (!this.playwrightBrowser) {
      throw new Error('File upload requires Playwright');
    }

    const page = await this.getPlaywrightPage(targetId);
    
    // Arm the file chooser
    page.once('filechooser', async fileChooser => {
      await fileChooser.setFiles(filePaths);
      console.log('[CustomDriver] ✓ Files uploaded:', filePaths);
    });

    console.log('[CustomDriver] File chooser armed');
  }

  /**
   * Wait for and handle download
   * @param {string} targetId - Target ID
   * @param {string} saveAs - Optional filename
   * @returns {Promise<string>} - Path to downloaded file
   */
  async waitForDownload(targetId, saveAs) {
    if (!this.playwrightBrowser) {
      throw new Error('Download handling requires Playwright');
    }

    const page = await this.getPlaywrightPage(targetId);
    const fs = require('fs');
    const path = require('path');
    
    // Ensure download directory exists
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      page.once('download', async download => {
        try {
          const suggestedFilename = download.suggestedFilename();
          const filename = saveAs || suggestedFilename;
          const savePath = path.join(this.downloadPath, filename);
          
          await download.saveAs(savePath);
          console.log('[CustomDriver] ✓ Download saved:', savePath);
          resolve(savePath);
        } catch (err) {
          reject(err);
        }
      });
      
      // Timeout after 30 seconds
      setTimeout(() => reject(new Error('Download timeout')), 30000);
    });
  }

  /**
   * Emulate device
   * @param {string} targetId - Target ID
   * @param {string} deviceName - Device name from Playwright presets
   * @returns {Promise<void>}
   */
  async emulateDevice(targetId, deviceName) {
    if (!this.playwrightBrowser) {
      throw new Error('Device emulation requires Playwright');
    }

    const { devices } = require('playwright-core');
    const deviceDescriptor = devices[deviceName];
    
    if (!deviceDescriptor) {
      throw new Error(`Unknown device: ${deviceName}. See playwright.dev/docs/emulation`);
    }

    const page = await this.getPlaywrightPage(targetId);
    
    // Apply device settings manually
    if (deviceDescriptor.viewport) {
      await page.setViewportSize(deviceDescriptor.viewport);
    }
    if (deviceDescriptor.userAgent) {
      await page.context().setExtraHTTPHeaders({
        'User-Agent': deviceDescriptor.userAgent
      });
    }
    
    console.log('[CustomDriver] ✓ Emulating device:', deviceName);
  }

  /**
   * Set geolocation
   * @param {string} targetId - Target ID
   * @param {Object} location - { latitude, longitude, accuracy }
   * @returns {Promise<void>}
   */
  async setGeolocation(targetId, location) {
    if (!this.playwrightBrowser) {
      throw new Error('Geolocation requires Playwright');
    }

    const page = await this.getPlaywrightPage(targetId);
    await page.context().setGeolocation(location);
    
    console.log('[CustomDriver] ✓ Geolocation set:', location);
  }

  /**
   * Clear geolocation
   * @param {string} targetId - Target ID
   * @returns {Promise<void>}
   */
  async clearGeolocation(targetId) {
    if (!this.playwrightBrowser) return;

    const page = await this.getPlaywrightPage(targetId);
    // Set geolocation to null to clear it
    await page.context().clearPermissions();
    
    console.log('[CustomDriver] ✓ Geolocation cleared');
  }

  /**
   * Set timezone
   * @param {string} targetId - Target ID
   * @param {string} timezoneId - IANA timezone ID
   * @returns {Promise<void>}
   */
  async setTimezone(targetId, timezoneId) {
    if (!this.playwrightBrowser) {
      throw new Error('Timezone override requires Playwright');
    }

    const page = await this.getPlaywrightPage(targetId);
    
    // Use CDP to set timezone via emulation
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setTimezoneOverride', { timezoneId });
    
    console.log('[CustomDriver] ✓ Timezone set:', timezoneId);
  }

  /**
   * Set custom headers
   * @param {string} targetId - Target ID
   * @param {Object} headers - Headers object
   * @returns {Promise<void>}
   */
  async setExtraHTTPHeaders(targetId, headers) {
    if (!this.playwrightBrowser) {
      throw new Error('Custom headers require Playwright');
    }

    const page = await this.getPlaywrightPage(targetId);
    await page.setExtraHTTPHeaders(headers);
    
    console.log('[CustomDriver] ✓ Custom headers set');
  }
}

module.exports = { CustomBrowserDriver };
