/**
 * Simple browser test script using puppeteer
 * Run with: node e2e/test-browser.mjs
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = join(__dirname, 'screenshots');

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (e) {
    // Directory may already exist
  }
}

async function runTests() {
  console.log('Starting browser tests...');

  await ensureDir(screenshotDir);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const baseUrl = 'http://localhost:3000';
  const results = [];

  try {
    // Test 1: Homepage loads
    console.log('Test 1: Loading homepage...');
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: join(screenshotDir, '01-homepage.png'), fullPage: true });
    results.push({ test: 'Homepage loads', passed: true });
    console.log('  ✓ Homepage loaded successfully');

    // Test 2: Check for main heading
    console.log('Test 2: Checking main content...');
    const hasContent = await page.evaluate(() => {
      return document.body.innerText.length > 100;
    });
    results.push({ test: 'Page has content', passed: hasContent });
    console.log(hasContent ? '  ✓ Page has content' : '  ✗ Page appears empty');

    // Test 3: Check for form elements
    console.log('Test 3: Checking form elements...');
    const hasInput = await page.evaluate(() => {
      return document.querySelectorAll('input, textarea').length > 0;
    });
    results.push({ test: 'Form elements present', passed: hasInput });
    console.log(hasInput ? '  ✓ Form elements found' : '  ✗ No form elements found');

    // Test 4: Check for tabs/navigation
    console.log('Test 4: Checking navigation...');
    const hasTabs = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('vin') || text.includes('listing') || text.includes('analyze');
    });
    results.push({ test: 'Navigation present', passed: hasTabs });
    console.log(hasTabs ? '  ✓ Navigation found' : '  ✗ Navigation not found');

    // Test 5: API test - VIN endpoint
    console.log('Test 5: Testing VIN API endpoint...');
    const vinResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/analyze/vin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vin: '1HGBH41JXMN109186',
            mileage: 50000,
            askingPrice: 15000
          })
        });
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { error: e.message };
      }
    });
    const vinPassed = vinResponse.status && vinResponse.status < 500;
    results.push({ test: 'VIN API responds', passed: vinPassed });
    console.log(vinPassed ? `  ✓ VIN API responded (${vinResponse.status})` : '  ✗ VIN API error');

    // Test 6: API test - History endpoint
    console.log('Test 6: Testing History API endpoint...');
    const historyResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/history/1HGBH41JXMN109186');
        const data = await res.json();
        return { status: res.status, hasSuccess: 'success' in data };
      } catch (e) {
        return { error: e.message };
      }
    });
    const historyPassed = historyResponse.hasSuccess;
    results.push({ test: 'History API structure', passed: historyPassed });
    console.log(historyPassed ? '  ✓ History API has correct structure' : '  ✗ History API structure invalid');

    // Test 7: Check results page
    console.log('Test 7: Checking results page...');
    await page.goto(`${baseUrl}/results`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: join(screenshotDir, '02-results-page.png'), fullPage: true });
    // Results page should redirect to home if no data
    const currentUrl = page.url();
    results.push({ test: 'Results page accessible', passed: true });
    console.log(`  ✓ Results page accessible (redirected to: ${currentUrl})`);

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: join(screenshotDir, 'error.png'), fullPage: true });
    results.push({ test: 'Unexpected error', passed: false, error: error.message });
  }

  await browser.close();

  // Print summary
  console.log('\n=== Test Summary ===');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}${r.error ? `: ${r.error}` : ''}`);
    });
  }

  console.log(`\nScreenshots saved to: ${screenshotDir}`);

  return failed === 0;
}

runTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
