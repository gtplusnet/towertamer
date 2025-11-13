import { test, expect } from '@playwright/test';

test.describe('Tower Tamer RPG - Game Initialization', () => {
  test('should load the game page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check that the page title is correct
    await expect(page).toHaveTitle(/Tower Tamer RPG/);
  });

  test('should render the game map', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check if the game container exists
    const gameMap = page.getByTestId('game-map');
    await expect(gameMap).toBeVisible({ timeout: 10000 });
  });

  test('should render the character sprite', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check if character canvas exists
    const characterCanvas = page.getByTestId('character-canvas');
    await expect(characterCanvas).toBeVisible({ timeout: 10000 });

    // Verify canvas has content (non-zero dimensions)
    const canvasElement = await characterCanvas.elementHandle();
    const dimensions = await canvasElement?.evaluate((el: HTMLCanvasElement) => ({
      width: el.width,
      height: el.height,
    }));

    expect(dimensions?.width).toBeGreaterThan(0);
    expect(dimensions?.height).toBeGreaterThan(0);
  });

  test('should display joystick controller', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check for joystick controller
    const joystickController = page.getByTestId('joystick-controller');
    await expect(joystickController).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Tower Tamer RPG - Mobile Viewport', () => {
  test('should be optimized for mobile viewport', async ({ page }) => {
    await page.goto('/');

    // Get viewport size
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
    expect(viewport?.height).toBe(667);

    // Check that body has proper mobile styles
    const body = page.locator('body');
    const overflow = await body.evaluate((el) =>
      window.getComputedStyle(el).overflow
    );
    expect(overflow).toBe('hidden');
  });

  test('should prevent scrolling', async ({ page }) => {
    await page.goto('/');

    // Try to scroll and verify position doesn't change
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy(0, 100));
    const scrollAfter = await page.evaluate(() => window.scrollY);

    expect(scrollBefore).toBe(scrollAfter);
  });
});
