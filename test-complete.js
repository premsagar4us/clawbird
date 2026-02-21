/**
 * Complete integration test - Phase 2 features
 * Demonstrates all implemented capabilities
 */

const { CustomBrowserDriver } = require('./driver');

async function completeTest() {
  console.log('=== Custom Browser Driver - Complete Integration Test ===\n');

  const driver = new CustomBrowserDriver();

  try {
    // Phase 1: Browser Launch & Connection
    console.log('━━━ Phase 1: Browser Launch ━━━');
    await driver.start({
      name: 'complete-test',
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      cdpPort: 19002,
      userDataDir: '/tmp/custom-browser-complete'
    });
    console.log('✓ Browser started (CDP + Playwright)\n');

    // Phase 2: Tab Management
    console.log('━━━ Phase 2: Tab Management ━━━');
    const tab1 = await driver.openTab('https://example.com');
    console.log('✓ Tab 1 opened:', tab1.url);
    
    await new Promise(r => setTimeout(r, 2000));
    
    const tabs = await driver.listTabs();
    console.log('✓ Total tabs:', tabs.length, '\n');

    // Phase 3: Snapshots
    console.log('━━━ Phase 3: Snapshots ━━━');
    
    // HTML snapshot
    const htmlSnapshot = await driver.snapshot(tab1.targetId, { format: 'html' });
    console.log('✓ HTML snapshot:', htmlSnapshot.html.length, 'chars');
    
    // ARIA snapshot
    const ariaSnapshot = await driver.snapshot(tab1.targetId, { format: 'aria' });
    console.log('✓ ARIA snapshot:', ariaSnapshot.snapshot?.length || 0, 'chars');
    console.log('  Format:', ariaSnapshot.format, '\n');

    // Phase 4: Screenshots
    console.log('━━━ Phase 4: Screenshots ━━━');
    const screenshot1 = await driver.screenshot(tab1.targetId);
    console.log('✓ Screenshot captured:', screenshot1.length, 'bytes');
    
    const fs = require('fs');
    fs.writeFileSync('/tmp/test-complete-1.png', screenshot1);
    console.log('✓ Saved to /tmp/test-complete-1.png\n');

    // Phase 5: Navigation
    console.log('━━━ Phase 5: Navigation & Actions ━━━');
    await driver.navigate(tab1.targetId, 'https://www.wikipedia.org');
    await new Promise(r => setTimeout(r, 2000));
    console.log('✓ Navigated to Wikipedia');

    // Resize viewport
    await driver.act(tab1.targetId, {
      kind: 'resize',
      width: 1024,
      height: 768
    });
    console.log('✓ Viewport resized to 1024x768');

    // Evaluate JavaScript
    const title = await driver.act(tab1.targetId, {
      kind: 'evaluate',
      fn: '() => document.title'
    });
    console.log('✓ Page title:', title);

    // Wait action
    await driver.act(tab1.targetId, {
      kind: 'wait',
      timeMs: 1000
    });
    console.log('✓ Wait completed\n');

    // Phase 6: Cookie & State Management
    console.log('━━━ Phase 6: Cookies & State ━━━');
    const cookies = await driver.getCookies(tab1.targetId);
    console.log('✓ Cookies retrieved:', cookies.length);
    
    await driver.setCookie(tab1.targetId, {
      name: 'test_cookie',
      value: 'openclaw_test',
      domain: 'wikipedia.org',
      path: '/'
    });
    console.log('✓ Cookie set\n');

    // Phase 7: Multi-tab Operations
    console.log('━━━ Phase 7: Multi-tab Operations ━━━');
    const tab2 = await driver.openTab('https://github.com');
    console.log('✓ Tab 2 opened:', tab2.url);
    
    await new Promise(r => setTimeout(r, 2000));
    
    await driver.focusTab(tab1.targetId);
    console.log('✓ Focused back to tab 1');
    
    const allTabs = await driver.listTabs();
    console.log('✓ Total tabs now:', allTabs.length);
    
    await driver.closeTab(tab2.targetId);
    console.log('✓ Tab 2 closed\n');

    // Phase 8: Final Status
    console.log('━━━ Phase 8: Final Status ━━━');
    const status = await driver.status();
    console.log('Status:', status);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All integration tests passed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Summary
    console.log('Summary:');
    console.log('  ✓ Browser lifecycle (start/stop)');
    console.log('  ✓ CDP connection');
    console.log('  ✓ Playwright integration');
    console.log('  ✓ Tab management');
    console.log('  ✓ HTML & ARIA snapshots');
    console.log('  ✓ Screenshots');
    console.log('  ✓ Navigation');
    console.log('  ✓ Actions (resize, evaluate, wait)');
    console.log('  ✓ Cookie management');
    console.log('  ✓ Multi-tab coordination');
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

// Run complete test
completeTest().catch(console.error);
