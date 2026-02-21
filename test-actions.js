/**
 * Test script for Playwright Actions
 * Tests click, type, hover, and other interactive features
 */

const { CustomBrowserDriver } = require('./driver');

async function testActions() {
  console.log('=== Custom Browser Driver - Actions Test ===\n');

  const driver = new CustomBrowserDriver();

  try {
    // Start browser
    console.log('Test 1: Starting browser with Playwright...');
    await driver.start({
      name: 'test-actions',
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      cdpPort: 19001,
      userDataDir: '/tmp/custom-browser-test-actions'
    });
    console.log('✓ Browser started with Playwright\n');

    // Open test page (Google for interactive elements)
    console.log('Test 2: Opening test page...');
    const tab = await driver.openTab('https://www.google.com');
    console.log('Tab opened:', tab.targetId);
    
    // Wait for page to load
    await new Promise(r => setTimeout(r, 3000));
    console.log('✓ Page loaded\n');

    // Test ARIA snapshot
    console.log('Test 3: Getting ARIA snapshot...');
    try {
      const ariaSnapshot = await driver.snapshot(tab.targetId, { format: 'aria' });
      console.log('ARIA Snapshot format:', ariaSnapshot.format);
      console.log('ARIA Snapshot length:', ariaSnapshot.snapshot?.length || 0, 'chars');
      console.log('✓ ARIA snapshot retrieved\n');
    } catch (err) {
      console.warn('⚠ ARIA snapshot failed:', err.message);
      console.log('Continuing with other tests...\n');
    }

    // Test viewport resize
    console.log('Test 4: Resizing viewport...');
    await driver.act(tab.targetId, {
      kind: 'resize',
      width: 1920,
      height: 1080
    });
    console.log('✓ Viewport resized\n');

    // Test keyboard press
    console.log('Test 5: Testing keyboard press (Tab)...');
    await driver.act(tab.targetId, {
      kind: 'press',
      key: 'Tab'
    });
    console.log('✓ Key pressed\n');

    // Test wait
    console.log('Test 6: Testing wait (2 seconds)...');
    await driver.act(tab.targetId, {
      kind: 'wait',
      timeMs: 2000
    });
    console.log('✓ Wait completed\n');

    // Test evaluate
    console.log('Test 7: Evaluating JavaScript...');
    await driver.act(tab.targetId, {
      kind: 'evaluate',
      fn: '() => document.title'
    });
    console.log('✓ JavaScript evaluated\n');

    // Test type action (search input)
    console.log('Test 8: Testing type action...');
    try {
      // Type in search box (using common selector)
      await driver.act(tab.targetId, {
        kind: 'type',
        ref: 'textarea[name="q"]',
        text: 'OpenClaw browser automation',
        submit: false
      });
      console.log('✓ Text typed into search box\n');
    } catch (err) {
      console.warn('⚠ Type action failed (selector may be wrong):', err.message);
      console.log('Continuing...\n');
    }

    // Screenshot after actions
    console.log('Test 9: Taking screenshot after actions...');
    const screenshot = await driver.screenshot(tab.targetId);
    const fs = require('fs');
    const screenshotPath = '/tmp/custom-browser-actions-screenshot.png';
    fs.writeFileSync(screenshotPath, screenshot);
    console.log('✓ Screenshot saved:', screenshotPath, '\n');

    console.log('=== All action tests completed! ===\n');

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
testActions().catch(console.error);
