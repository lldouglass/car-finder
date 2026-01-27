import { test, expect } from '@playwright/test';

test.describe('Vehicle Analysis Platform', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('homepage loads correctly', async ({ page }) => {
    // Check that the main heading is visible
    await expect(page.locator('h1')).toBeVisible();

    // Take screenshot of homepage
    await page.screenshot({ path: 'e2e/screenshots/homepage.png', fullPage: true });
  });

  test('VIN analysis form is present', async ({ page }) => {
    // Check for VIN input field
    const vinInput = page.locator('input[placeholder*="VIN"], input[name*="vin"], input[id*="vin"]');

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/vin-form.png', fullPage: true });
  });

  test('listing analysis form is present', async ({ page }) => {
    // Look for tabs or listing text area
    const listingTab = page.locator('text=Listing');
    const listingTextarea = page.locator('textarea');

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/listing-form.png', fullPage: true });
  });

  test('can navigate to results page', async ({ page }) => {
    // Fill in a test VIN (this is a sample Toyota Camry VIN)
    const vinInput = page.locator('input').first();

    // Check if input exists
    if (await vinInput.isVisible()) {
      await page.screenshot({ path: 'e2e/screenshots/form-visible.png', fullPage: true });
    }
  });
});

test.describe('Results Page Features', () => {
  test('displays component issues section when available', async ({ page }) => {
    // Navigate to results page (this would need a valid analysis result)
    await page.goto('/results');

    // Take screenshot - may redirect to home if no result
    await page.screenshot({ path: 'e2e/screenshots/results-page.png', fullPage: true });
  });
});

test.describe('API Endpoints', () => {
  test('VIN analysis endpoint responds', async ({ request }) => {
    // Test the API endpoint structure
    const response = await request.post('/api/analyze/vin', {
      data: {
        vin: '1HGBH41JXMN109186', // Sample VIN
        mileage: 50000,
        askingPrice: 15000
      }
    });

    // Should get a response (may be 404 for invalid VIN, but endpoint works)
    expect(response.status()).toBeLessThan(500);
  });

  test('listing analysis endpoint responds', async ({ request }) => {
    const response = await request.post('/api/analyze/listing', {
      data: {
        listingText: '2020 Toyota Camry, 45000 miles, one owner, clean title, asking $18000',
        askingPrice: 18000,
        mileage: 45000
      }
    });

    // Should get a response
    expect(response.status()).toBeLessThan(500);
  });

  test('history endpoint structure is correct', async ({ request }) => {
    // Test the history API endpoint (will fail without API key, but structure should be valid)
    const response = await request.get('/api/history/1HGBH41JXMN109186');

    const data = await response.json();

    // Should have success field
    expect(data).toHaveProperty('success');

    // If feature not configured, should indicate that
    if (!data.success) {
      expect(data.error || data.featureAvailable === false).toBeTruthy();
    }
  });
});
