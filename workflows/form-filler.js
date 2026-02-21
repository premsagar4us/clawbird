#!/usr/bin/env node
/**
 * Form Filler Workflow
 * Auto-fills forms with saved data
 */

const { CustomBrowserDriver } = require('../driver');
const fs = require('fs');

class FormFiller {
  constructor() {
    this.driver = new CustomBrowserDriver();
    this.profilesFile = '/tmp/form-profiles.json';
  }

  /**
   * Load saved form profiles
   */
  loadProfiles() {
    if (fs.existsSync(this.profilesFile)) {
      return JSON.parse(fs.readFileSync(this.profilesFile, 'utf8'));
    }
    return this.getDefaultProfiles();
  }

  /**
   * Default form profiles
   */
  getDefaultProfiles() {
    return {
      personal: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001'
      },
      work: {
        company: 'Acme Corp',
        title: 'Software Engineer',
        email: 'john@acme.com',
        phone: '555-0199'
      }
    };
  }

  /**
   * Fill a form on a webpage
   */
  async fillForm(url, formData, fieldMappings) {
    console.log(`\n📝 Filling form at: ${url}`);
    
    const tab = await this.driver.openTab(url);
    
    // Wait for page load
    await this.driver.act(tab.targetId, {
      kind: 'wait',
      timeMs: 3000
    });

    console.log(`   Filling ${Object.keys(fieldMappings).length} fields...`);

    // Fill each field
    for (const [dataKey, selector] of Object.entries(fieldMappings)) {
      const value = formData[dataKey];
      
      if (!value) {
        console.log(`   ⚠ Skipping ${dataKey} (no value)`);
        continue;
      }

      try {
        await this.driver.act(tab.targetId, {
          kind: 'type',
          ref: selector,
          text: String(value)
        });
        
        console.log(`   ✓ ${dataKey}: ${value}`);
        
        // Small delay between fields
        await this.driver.act(tab.targetId, {
          kind: 'wait',
          timeMs: 300
        });
        
      } catch (error) {
        console.error(`   ❌ Failed to fill ${dataKey}:`, error.message);
      }
    }

    // Take screenshot of filled form
    const screenshot = await this.driver.screenshot(tab.targetId);
    const screenshotPath = `/tmp/form-filled-${Date.now()}.png`;
    fs.writeFileSync(screenshotPath, screenshot);

    console.log(`   📸 Screenshot: ${screenshotPath}`);

    // Don't submit automatically (safety)
    console.log(`   ⚠ Form filled but NOT submitted (manual review required)`);

    await this.driver.closeTab(tab.targetId);

    return {
      url,
      fieldsFilled: Object.keys(fieldMappings).length,
      screenshot: screenshotPath
    };
  }

  /**
   * Fill multiple forms in batch
   */
  async fillBatch(forms, profileName = 'personal') {
    console.log(`\n🤖 Form Filler - Using profile: ${profileName}\n`);

    await this.driver.start({
      name: 'form-filler',
      cdpPort: 19103
    });

    const profiles = this.loadProfiles();
    const formData = profiles[profileName];

    if (!formData) {
      throw new Error(`Profile '${profileName}' not found`);
    }

    const results = [];

    for (const form of forms) {
      try {
        const result = await this.fillForm(form.url, formData, form.fields);
        results.push(result);
      } catch (error) {
        console.error(`   ❌ Error filling form at ${form.url}:`, error.message);
      }
    }

    await this.driver.stop();

    console.log(`\n✅ Batch complete! Filled ${results.length}/${forms.length} forms.\n`);
    
    return results;
  }
}

// Example usage
async function main() {
  const filler = new FormFiller();

  const forms = [
    {
      name: 'Contact Form',
      url: 'https://example.com/contact',
      fields: {
        firstName: 'input[name="first_name"]',
        lastName: 'input[name="last_name"]',
        email: 'input[name="email"]',
        phone: 'input[name="phone"]'
      }
    }
    // Add more forms:
    // {
    //   name: 'Job Application',
    //   url: 'https://company.com/apply',
    //   fields: {
    //     firstName: '#firstName',
    //     lastName: '#lastName',
    //     email: '#email',
    //     company: '#currentCompany',
    //     title: '#currentTitle'
    //   }
    // }
  ];

  await filler.fillBatch(forms, 'personal');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { FormFiller };
