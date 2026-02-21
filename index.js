/**
 * OpenClaw Custom Browser Plugin
 * Registers a custom browser driver with OpenClaw
 */

const { CustomBrowserDriver } = require('./driver');

module.exports = {
  name: 'custom-browser',
  version: '0.1.0',
  description: 'Custom browser driver for OpenClaw',

  /**
   * Initialize plugin
   * Called when OpenClaw loads the plugin
   * @param {Object} openclaw - OpenClaw instance
   */
  async init(openclaw) {
    console.log('[CustomBrowser Plugin] Initializing...');

    // Register the custom driver
    // Note: This assumes OpenClaw exposes a browser.registerDriver() API
    // If not available, you'll need to manually configure profiles in openclaw.json
    
    if (openclaw.browser && openclaw.browser.registerDriver) {
      openclaw.browser.registerDriver('custom', CustomBrowserDriver);
      console.log('[CustomBrowser Plugin] Driver registered');
    } else {
      console.warn('[CustomBrowser Plugin] Direct driver registration not available');
      console.log('[CustomBrowser Plugin] Add profile to ~/.openclaw/openclaw.json manually');
    }

    // Optionally add a default profile
    const profileConfig = {
      driver: 'custom',
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      cdpPort: 19000,
      userDataDir: `${process.env.HOME}/.openclaw/browser/custom`,
      color: '#00FF00',
      customFlags: [
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security' // Only for dev/testing!
      ]
    };

    console.log('[CustomBrowser Plugin] Suggested profile config:');
    console.log(JSON.stringify({ browser: { profiles: { custom: profileConfig } } }, null, 2));
  },

  /**
   * Cleanup on plugin unload
   */
  async destroy() {
    console.log('[CustomBrowser Plugin] Cleaning up...');
  }
};
