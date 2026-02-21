#!/usr/bin/env node
/**
 * News Aggregator Workflow
 * Visits multiple news sites and compiles headlines
 */

const { CustomBrowserDriver } = require('../driver');
const fs = require('fs');

class NewsAggregator {
  constructor() {
    this.driver = new CustomBrowserDriver();
  }

  /**
   * Extract headlines from a news site
   */
  async extractHeadlines(url, headlineSelector) {
    console.log(`\n📰 Visiting: ${url}`);
    
    const tab = await this.driver.openTab(url);
    
    // Wait for content
    await this.driver.act(tab.targetId, {
      kind: 'wait',
      timeMs: 3000
    });

    // Extract headlines
    const headlines = await this.driver.act(tab.targetId, {
      kind: 'evaluate',
      fn: `(selector) => {
        const elements = document.querySelectorAll(selector || 'h1, h2, h3');
        return Array.from(elements)
          .map(el => ({
            text: el.textContent.trim(),
            link: el.closest('a')?.href || null
          }))
          .filter(item => item.text.length > 10)
          .slice(0, 10); // Top 10 headlines
      }`
    });

    // Take screenshot
    const screenshot = await this.driver.screenshot(tab.targetId);
    const screenshotPath = `/tmp/news-${Date.now()}.png`;
    fs.writeFileSync(screenshotPath, screenshot);

    await this.driver.closeTab(tab.targetId);

    return {
      source: url,
      headlines: headlines || [],
      timestamp: new Date().toISOString(),
      screenshot: screenshotPath
    };
  }

  /**
   * Aggregate news from multiple sources
   */
  async aggregate(sources) {
    console.log(`\n📡 News Aggregator - Collecting from ${sources.length} sources...\n`);

    await this.driver.start({
      name: 'news-aggregator',
      cdpPort: 19101
    });

    const allNews = [];

    for (const source of sources) {
      try {
        const news = await this.extractHeadlines(source.url, source.selector);
        
        console.log(`   ✓ Found ${news.headlines.length} headlines`);
        console.log(`   Screenshot: ${news.screenshot}`);

        allNews.push({
          ...news,
          name: source.name
        });

      } catch (error) {
        console.error(`   ❌ Error fetching ${source.name}:`, error.message);
      }
    }

    await this.driver.stop();

    // Generate report
    const report = this.generateReport(allNews);
    const reportPath = `/tmp/news-report-${Date.now()}.html`;
    fs.writeFileSync(reportPath, report);

    console.log(`\n✅ Aggregation complete!`);
    console.log(`📄 Report saved: ${reportPath}`);
    console.log(`📊 Total headlines: ${allNews.reduce((sum, n) => sum + n.headlines.length, 0)}\n`);

    return { allNews, reportPath };
  }

  /**
   * Generate HTML report
   */
  generateReport(newsData) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>News Aggregator Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    .source { margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .source h2 { color: #007bff; margin-top: 0; }
    .headline { margin: 10px 0; padding: 10px; background: white; border-left: 3px solid #007bff; }
    .headline a { color: #333; text-decoration: none; }
    .headline a:hover { color: #007bff; }
    .meta { color: #666; font-size: 0.9em; margin-top: 20px; }
    .screenshot { max-width: 200px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>📰 News Aggregator Report</h1>
  <div class="meta">Generated: ${new Date().toLocaleString()}</div>
  
  ${newsData.map(source => `
    <div class="source">
      <h2>${source.name}</h2>
      <div class="meta">Source: ${source.source}</div>
      <div class="meta">${source.headlines.length} headlines found</div>
      
      ${source.headlines.map((headline, i) => `
        <div class="headline">
          ${headline.link ? 
            `<a href="${headline.link}" target="_blank">${i + 1}. ${headline.text}</a>` :
            `${i + 1}. ${headline.text}`
          }
        </div>
      `).join('')}
      
      <img src="${source.screenshot}" class="screenshot" alt="Screenshot">
    </div>
  `).join('')}
</body>
</html>
    `;
    
    return html;
  }
}

// Example usage
async function main() {
  const aggregator = new NewsAggregator();

  const sources = [
    {
      name: 'Example News',
      url: 'https://example.com',
      selector: 'h1, h2' // In real use, target specific headline elements
    },
    {
      name: 'Wikipedia',
      url: 'https://www.wikipedia.org',
      selector: 'h2, h3'
    }
    // Add real news sites:
    // {
    //   name: 'TechCrunch',
    //   url: 'https://techcrunch.com',
    //   selector: '.post-block__title'
    // },
    // {
    //   name: 'Hacker News',
    //   url: 'https://news.ycombinator.com',
    //   selector: '.titleline a'
    // }
  ];

  const result = await aggregator.aggregate(sources);
  
  console.log(`\n📖 Open the report:`);
  console.log(`   open ${result.reportPath}\n`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { NewsAggregator };
