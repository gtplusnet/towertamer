import { test, expect } from '@playwright/test';

test.describe('Auth Module Export Test', () => {
  test('should verify auth.service exports are available', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://100.121.246.85:4024');

    // Wait a bit for modules to load
    await page.waitForTimeout(2000);

    // Check for module errors in console
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Wait for any errors to appear
    await page.waitForTimeout(3000);

    // Log errors for debugging
    console.log('Browser errors:', errors);

    // Check if the specific export error exists
    const hasExportError = errors.some(err =>
      err.includes('does not provide an export named')
    );

    if (hasExportError) {
      console.log('Export error found. Checking module structure...');
    }

    // Take screenshot for debugging
    await page.screenshot({ path: 'debug/auth-error.png', fullPage: true });
  });
});
