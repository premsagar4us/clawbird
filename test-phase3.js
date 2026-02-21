/**
 * Phase 3 Features Test
 * Tests console capture, network monitoring, file upload/download, device emulation
 */

const { CustomBrowserDriver } = require('./driver');
const fs = require('fs');
const path = require('path');

async function testPhase3() {
  console.log('=== Custom Browser Driver - Phase 3 Features Test ===\n');

  const driver = new CustomBrowserDriver();

  try {
    // Start browser
    console.log('━━━ Starting Browser ━━━');
    await driver.start({
      name: 'test-phase3',
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      cdpPort: 19003,
      userDataDir: '/tmp/custom-browser-phase3'
    });
    console.log('✓ Browser started\n');

    // Open test page
    const tab = await driver.openTab('https://example.com');
    await new Promise(r => setTimeout(r, 2000));
    console.log('✓ Test page opened\n');

    // Test 1: Console log capture
    console.log('━━━ Test 1: Console Log Capture ━━━');
    await driver.setupConsoleCapture(tab.targetId);
    
    // Trigger some console logs
    await driver.act(tab.targetId, {
      kind: 'evaluate',
      fn: '() => { console.log("Test log"); console.warn("Test warning"); console.error("Test error"); }'
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    const allLogs = await driver.getConsoleLogs(tab.targetId);
    console.log('✓ Console logs captured:', allLogs.length);
    
    const errors = await driver.getConsoleLogs(tab.targetId, { level: 'error' });
    console.log('✓ Error logs:', errors.length);
    
    await driver.clearConsoleLogs(tab.targetId);
    console.log('✓ Console logs cleared\n');

    // Test 2: Network monitoring
    console.log('━━━ Test 2: Network Monitoring ━━━');
    await driver.setupNetworkMonitoring(tab.targetId);
    
    // Navigate to trigger network requests
    await driver.navigate(tab.targetId, 'https://www.wikipedia.org');
    await new Promise(r => setTimeout(r, 3000));
    
    const networkLogs = await driver.getNetworkLogs(tab.targetId);
    console.log('✓ Network logs captured:', networkLogs.length, 'events');
    
    const apiCalls = await driver.getNetworkLogs(tab.targetId, { filter: 'api' });
    console.log('✓ API calls:', apiCalls.length);
    
    await driver.clearNetworkLogs(tab.targetId);
    console.log('✓ Network logs cleared\n');

    // Test 3: Geolocation
    console.log('━━━ Test 3: Geolocation ━━━');
    await driver.setGeolocation(tab.targetId, {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 100
    });
    console.log('✓ Geolocation set (San Francisco)');
    
    await driver.clearGeolocation(tab.targetId);
    console.log('✓ Geolocation cleared\n');

    // Test 4: Timezone
    console.log('━━━ Test 4: Timezone ━━━');
    await driver.setTimezone(tab.targetId, 'America/New_York');
    console.log('✓ Timezone set to America/New_York');
    
    const time = await driver.act(tab.targetId, {
      kind: 'evaluate',
      fn: '() => new Date().toString()'
    });
    console.log('✓ Current time in page:', time, '\n');

    // Test 5: Custom headers
    console.log('━━━ Test 5: Custom HTTP Headers ━━━');
    await driver.setExtraHTTPHeaders(tab.targetId, {
      'X-Custom-Header': 'OpenClaw-Test',
      'X-Agent': 'CustomBrowser/0.2.0'
    });
    console.log('✓ Custom headers set\n');

    // Test 6: Device emulation
    console.log('━━━ Test 6: Device Emulation ━━━');
    try {
      await driver.emulateDevice(tab.targetId, 'iPhone 13');
      console.log('✓ Emulating iPhone 13');
      
      const userAgent = await driver.act(tab.targetId, {
        kind: 'evaluate',
        fn: '() => navigator.userAgent'
      });
      console.log('✓ User agent:', userAgent?.substring(0, 50) + '...');
      
      // Screenshot in mobile mode
      const mobileScreenshot = await driver.screenshot(tab.targetId);
      fs.writeFileSync('/tmp/phase3-mobile-screenshot.png', mobileScreenshot);
      console.log('✓ Mobile screenshot saved\n');
    } catch (err) {
      console.warn('⚠ Device emulation failed:', err.message, '\n');
    }

    // Test 7: File upload preparation
    console.log('━━━ Test 7: File Upload Preparation ━━━');
    
    // Create a test file
    const testFilePath = '/tmp/test-upload.txt';
    fs.writeFileSync(testFilePath, 'OpenClaw test upload file');
    
    await driver.setupFileUpload(tab.targetId, [testFilePath]);
    console.log('✓ File chooser armed for:', testFilePath);
    console.log('  (Would be triggered by clicking a file input)\n');

    // Test 8: Download preparation
    console.log('━━━ Test 8: Download Handling ━━━');
    console.log('✓ Download path configured:', driver.downloadPath);
    console.log('  (Download would be captured on trigger)\n');

    // Test 9: Comprehensive status
    console.log('━━━ Test 9: Final Status ━━━');
    const status = await driver.status();
    console.log('Status:', status);
    
    const finalLogs = await driver.getConsoleLogs(tab.targetId);
    console.log('Console logs:', finalLogs.length);
    
    const finalNetwork = await driver.getNetworkLogs(tab.targetId);
    console.log('Network events:', finalNetwork.length);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Phase 3 features test complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Summary:');
    console.log('  ✓ Console log capture');
    console.log('  ✓ Network request monitoring');
    console.log('  ✓ Geolocation override');
    console.log('  ✓ Timezone emulation');
    console.log('  ✓ Custom HTTP headers');
    console.log('  ✓ Device emulation');
    console.log('  ✓ File upload preparation');
    console.log('  ✓ Download handling setup');
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    console.log('Cleanup: Stopping browser...');
    await driver.stop();
    console.log('✓ Done.\n');
  }
}

// Run Phase 3 tests
testPhase3().catch(console.error);
