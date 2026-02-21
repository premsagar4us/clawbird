#!/usr/bin/env node
/**
 * Workflow Runner
 * Central command for running all workflows
 */

const { PriceMonitor } = require('./price-monitor');
const { NewsAggregator } = require('./news-aggregator');
const { ScreenshotDocumenter } = require('./screenshot-documenter');
const { FormFiller } = require('./form-filler');

class WorkflowRunner {
  constructor() {
    this.workflows = {
      'price-monitor': () => this.runPriceMonitor(),
      'news-aggregator': () => this.runNewsAggregator(),
      'screenshot-documenter': () => this.runScreenshotDocumenter(),
      'form-filler': () => this.runFormFiller()
    };
  }

  /**
   * List available workflows
   */
  list() {
    console.log('\n📋 Available Workflows:\n');
    console.log('  1. price-monitor         - Track product prices');
    console.log('  2. news-aggregator       - Compile news headlines');
    console.log('  3. screenshot-documenter - Capture responsive screenshots');
    console.log('  4. form-filler          - Auto-fill forms');
    console.log('');
    console.log('Usage: node workflow-runner.js <workflow-name>');
    console.log('Example: node workflow-runner.js price-monitor\n');
  }

  /**
   * Run price monitor workflow
   */
  async runPriceMonitor() {
    const monitor = new PriceMonitor();
    
    const products = [
      {
        name: 'Example Product',
        url: 'https://example.com'
      }
    ];

    await monitor.monitor(products);
  }

  /**
   * Run news aggregator workflow
   */
  async runNewsAggregator() {
    const aggregator = new NewsAggregator();
    
    const sources = [
      {
        name: 'Example News',
        url: 'https://example.com',
        selector: 'h1, h2'
      },
      {
        name: 'Wikipedia',
        url: 'https://www.wikipedia.org',
        selector: 'h2, h3'
      }
    ];

    const result = await aggregator.aggregate(sources);
    console.log(`\n📖 Open the report: open ${result.reportPath}\n`);
  }

  /**
   * Run screenshot documenter workflow
   */
  async runScreenshotDocumenter() {
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
    ];

    const result = await documenter.documentPages(pages);
    console.log(`\n📖 Open the documentation: open ${result.indexPath}\n`);
  }

  /**
   * Run form filler workflow
   */
  async runFormFiller() {
    const filler = new FormFiller();
    
    const forms = [
      {
        name: 'Contact Form',
        url: 'https://example.com/contact',
        fields: {
          firstName: 'input[name="first_name"]',
          lastName: 'input[name="last_name"]',
          email: 'input[name="email"]'
        }
      }
    ];

    await filler.fillBatch(forms, 'personal');
  }

  /**
   * Run a specific workflow
   */
  async run(workflowName) {
    if (!workflowName) {
      this.list();
      return;
    }

    const workflow = this.workflows[workflowName];
    
    if (!workflow) {
      console.error(`\n❌ Unknown workflow: ${workflowName}\n`);
      this.list();
      process.exit(1);
    }

    console.log(`\n🚀 Running workflow: ${workflowName}\n`);
    
    try {
      await workflow();
      console.log(`\n✅ Workflow '${workflowName}' completed successfully!\n`);
    } catch (error) {
      console.error(`\n❌ Workflow '${workflowName}' failed:`, error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// CLI
if (require.main === module) {
  const workflowName = process.argv[2];
  const runner = new WorkflowRunner();
  runner.run(workflowName).catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { WorkflowRunner };
