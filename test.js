/**
 * Test script for Custom Browser Driver
 * Run this to test the driver independently before OpenClaw integration
 */

const { CustomBrowserDriver } = require('./driver');

async function test() {
  console.log('=== Custom Browser Driver Test ===\n');

  const driver = new CustomBrowserDriver();

  try {
    // Test 1: Start browser
    console.log('Test 1: Starting browser...');
    await driver.start({
      name: 'test',
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      cdpPort: 19000,
      userDataDir: '/tmp/custom-browser-test'
    });
    console.log('✓ Browser started\n');

    // Test 2: Check status
    console.log('Test 2: Checking status...');
    const status = await driver.status();
    console.log('Status:', status);
    console.log('✓ Status retrieved\n');

    // Test 3: Open tab
    console.log('Test 3: Opening tab...');
    const tab = await driver.openTab('https://example.com');
    console.log('Tab opened:', tab);
    console.log('✓ Tab opened\n');

    // Wait for page to load
    await new Promise(r => setTimeout(r, 3000));

    // Test 4: List tabs
    console.log('Test 4: Listing tabs...');
    const tabs = await driver.listTabs();
    console.log('Tabs:', tabs);
    console.log('✓ Tabs listed\n');

    // Test 5: Screenshot
    console.log('Test 5: Taking screenshot...');
    const screenshot = await driver.screenshot(tab.targetId, { fullPage: false });
    console.log('Screenshot size:', screenshot.length, 'bytes');
    
    // Save screenshot
    const fs = require('fs');
    const screenshotPath = '/tmp/custom-browser-screenshot.png';
    fs.writeFileSync(screenshotPath, screenshot);
    console.log('✓ Screenshot saved to:', screenshotPath, '\n');

    // Test 6: Snapshot
    console.log('Test 6: Getting page snapshot...');
    const snapshot = await driver.snapshot(tab.targetId);
    console.log('Snapshot format:', snapshot.format);
    console.log('HTML length:', snapshot.html.length, 'chars');
    console.log('✓ Snapshot retrieved\n');

    // Test 7: Evaluate JavaScript
    console.log('Test 7: Evaluating JavaScript...');
    const title = await driver.evaluate(tab.targetId, 'document.title');
    console.log('Page title:', title);
    console.log('✓ JavaScript evaluated\n');

    // Test 8: Get cookies
    console.log('Test 8: Getting cookies...');
    const cookies = await driver.getCookies(tab.targetId);
    console.log('Cookies count:', cookies.length);
    console.log('✓ Cookies retrieved\n');

    // Test 9: Navigate
    console.log('Test 9: Navigating to new URL...');
    await driver.navigate(tab.targetId, 'https://www.google.com');
    await new Promise(r => setTimeout(r, 2000));
    console.log('✓ Navigation complete\n');

    // Test 10: Close tab
    console.log('Test 10: Closing tab...');
    await driver.closeTab(tab.targetId);
    console.log('✓ Tab closed\n');

    console.log('=== All tests passed! ===\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    console.log('Stopping browser...');
    await driver.stop();
    console.log('Done.');
  }
}

// Run tests
test().catch(console.error);
