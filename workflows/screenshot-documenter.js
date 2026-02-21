#!/usr/bin/env node
/**
 * Screenshot Documenter Workflow
 * Captures screenshots of websites for documentation or comparison
 */

const { CustomBrowserDriver } = require('../driver');
const fs = require('fs');
const path = require('path');

class ScreenshotDocumenter {
  constructor(outputDir = '/tmp/screenshots') {
    this.driver = new CustomBrowserDriver();
    this.outputDir = outputDir;
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Capture screenshots of a website at different viewports
   */
  async captureResponsive(url, name) {
    console.log(`\n📸 Capturing ${name}: ${url}`);
    
    const tab = await this.driver.openTab(url);
    
    // Wait for page load
    await this.driver.act(tab.targetId, {
      kind: 'wait',
      timeMs: 3000
    });

    const viewports = [
      { name: 'mobile', width: 375, height: 667 },      // iPhone
      { name: 'tablet', width: 768, height: 1024 },     // iPad
      { name: 'desktop', width: 1920, height: 1080 }    // Desktop
    ];

    const screenshots = [];

    for (const viewport of viewports) {
      console.log(`   📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      // Resize viewport
      await this.driver.act(tab.targetId, {
        kind: 'resize',
        width: viewport.width,
        height: viewport.height
      });

      // Wait for reflow
      await this.driver.act(tab.targetId, {
        kind: 'wait',
        timeMs: 500
      });

      // Capture screenshot
      const screenshot = await this.driver.screenshot(tab.targetId, {
        fullPage: false
      });

      const filename = `${name}-${viewport.name}-${Date.now()}.png`;
      const filepath = path.join(this.outputDir, filename);
      fs.writeFileSync(filepath, screenshot);

      screenshots.push({
        viewport: viewport.name,
        width: viewport.width,
        height: viewport.height,
        filepath
      });

      console.log(`      ✓ Saved: ${filepath}`);
    }

    await this.driver.closeTab(tab.targetId);

    return screenshots;
  }

  /**
   * Document multiple pages with full-page screenshots
   */
  async documentPages(pages) {
    console.log(`\n📚 Screenshot Documenter - Capturing ${pages.length} pages...\n`);

    await this.driver.start({
      name: 'screenshot-documenter',
      cdpPort: 19102
    });

    const allScreenshots = [];

    for (const page of pages) {
      try {
        const screenshots = await this.captureResponsive(page.url, page.name);
        allScreenshots.push({
          page: page.name,
          url: page.url,
          screenshots
        });
      } catch (error) {
        console.error(`   ❌ Error capturing ${page.name}:`, error.message);
      }
    }

    await this.driver.stop();

    // Generate index HTML
    const indexPath = this.generateIndex(allScreenshots);

    console.log(`\n✅ Documentation complete!`);
    console.log(`📁 Screenshots saved to: ${this.outputDir}`);
    console.log(`📄 Index: ${indexPath}`);
    console.log(`📊 Total screenshots: ${allScreenshots.reduce((sum, p) => sum + p.screenshots.length, 0)}\n`);

    return { allScreenshots, indexPath };
  }

  /**
   * Generate HTML index of all screenshots
   */
  generateIndex(data) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Screenshot Documentation</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1400px; margin: 20px auto; padding: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    .page { margin: 30px 0; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .page h2 { color: #007bff; margin-top: 0; }
    .screenshots { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 20px; }
    .screenshot-item { flex: 1; min-width: 300px; text-align: center; }
    .screenshot-item img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    .viewport-label { font-weight: bold; color: #666; margin: 10px 0; }
    .dimensions { font-size: 0.9em; color: #999; }
    .meta { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>📸 Screenshot Documentation</h1>
  <div class="meta">Generated: ${new Date().toLocaleString()}</div>
  <div class="meta">Total pages: ${data.length}</div>
  
  ${data.map(page => `
    <div class="page">
      <h2>${page.page}</h2>
      <div class="meta">URL: <a href="${page.url}" target="_blank">${page.url}</a></div>
      
      <div class="screenshots">
        ${page.screenshots.map(shot => `
          <div class="screenshot-item">
            <div class="viewport-label">${shot.viewport}</div>
            <div class="dimensions">${shot.width} × ${shot.height}</div>
            <img src="${path.basename(shot.filepath)}" alt="${shot.viewport}">
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')}
</body>
</html>
    `;

    const indexPath = path.join(this.outputDir, 'index.html');
    fs.writeFileSync(indexPath, html);
    return indexPath;
  }
}

// Example usage
async function main() {
  const documenter = new ScreenshotDocumenter();

  const pages = [
    {
      name: 'Example',
      url: 'https://example.com'
    },
    {
      name: 'Wikipedia',
      url: 'https://www.wikipedia.org'
    }
    // Add your pages:
    // {
    //   name: 'My App - Home',
    //   url: 'https://myapp.com'
    // },
    // {
    //   name: 'My App - Dashboard',
    //   url: 'https://myapp.com/dashboard'
    // }
  ];

  const result = await documenter.documentPages(pages);
  
  console.log(`\n📖 Open the documentation:`);
  console.log(`   open ${result.indexPath}\n`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ScreenshotDocumenter };
