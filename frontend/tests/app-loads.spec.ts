import { test, expect } from '@playwright/test';

test.describe('Application Loading', () => {
  test('should load the app without module errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // Navigate to the app
    await page.goto('http://100.121.246.85:4024');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Wait a bit more for any delayed module loading
    await page.waitForTimeout(3000);

    // Log all errors
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.log('Page errors:', pageErrors);
    }

    // Check for module export errors
    const hasModuleError = [...consoleErrors, ...pageErrors].some(err =>
      err.includes('does not provide an export named') ||
      err.includes('Failed to fetch dynamically imported module')
    );

    // Take screenshot for debugging
    await page.screenshot({ path: 'debug/app-loaded.png', fullPage: true });

    // Assert no module errors
    expect(hasModuleError).toBe(false);

    // Check that we're either on login page or game page
    const url = page.url();
    const isOnExpectedPage = url.includes('/login') || url.includes('/register') || url.includes('/game');

    expect(isOnExpectedPage).toBe(true);

    // Verify page title or some content loaded
    const title = await page.title();
    console.log('Page title:', title);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('http://100.121.246.85:4024/login');
    await page.waitForLoadState('networkidle');

    // Check for login form elements
    const usernameInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"]').first();

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    await page.screenshot({ path: 'debug/login-page.png' });
  });
});
