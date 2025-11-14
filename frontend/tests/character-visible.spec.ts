import { test, expect } from '@playwright/test';

test.describe('Character Visibility Test', () => {
  test('should render character on the game page', async ({ page }) => {
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];

    // Capture all console messages
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Navigate to game (will redirect to login if not authenticated)
    await page.goto('http://100.121.246.85:4024/game');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if redirected to login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('Redirected to login - user not authenticated');

      // Try to login with test credentials or check login form
      const loginForm = await page.locator('form').count();
      console.log('Login forms found:', loginForm);

      await page.screenshot({ path: 'debug/redirected-to-login.png' });
    } else {
      console.log('On game page - checking for character');

      // Wait for game to load
      await page.waitForTimeout(3000);

      // Check for character element
      const characterElement = await page.locator('[data-testid="character"]').count();
      console.log('Character elements found:', characterElement);

      // Check for game map
      const gameMap = await page.locator('[data-testid="game-map"]').count();
      console.log('Game map found:', gameMap);

      // Check if character sprite is rendered
      const characterSprite = await page.locator('.character').count();
      console.log('Character sprites found:', characterSprite);

      // Get all divs to see what's on the page
      const allDivs = await page.locator('div').count();
      console.log('Total div elements:', allDivs);

      await page.screenshot({ path: 'debug/game-page-no-character.png', fullPage: true });
    }

    // Log all console messages
    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => console.log(msg));

    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach(err => console.log(err));
    }
  });
});
