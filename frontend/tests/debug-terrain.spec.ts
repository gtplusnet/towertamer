import { test, expect } from '@playwright/test';

test.describe('Debug Terrain System', () => {
  test('should debug character visibility and map movement', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Navigate to the page
    await page.goto('http://100.121.246.85:5173/');

    // Wait for map to load
    await page.waitForSelector('[data-testid="game-map"]', { timeout: 5000 });

    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/debug-initial.png', fullPage: true });

    // Check if character element exists
    const character = page.locator('[data-testid="character"]');
    const isCharacterVisible = await character.isVisible();
    console.log('Character visible:', isCharacterVisible);

    // Get character position
    const charBoundingBox = await character.boundingBox();
    console.log('Character bounding box:', charBoundingBox);

    // Get character canvas
    const canvas = page.locator('[data-testid="character-canvas"]');
    const canvasBox = await canvas.boundingBox();
    console.log('Canvas bounding box:', canvasBox);

    // Get initial grid position
    const initialRow = await character.getAttribute('data-grid-row');
    const initialCol = await character.getAttribute('data-grid-col');
    console.log('Initial grid position:', { row: initialRow, col: initialCol });

    // Get initial map transform
    const gameMap = page.locator('[data-testid="game-map"]');
    const mapContainer = gameMap.locator('> div').first(); // First child div is mapContainer
    const initialTransform = await mapContainer.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    console.log('Initial map transform:', initialTransform);

    // Perform a swipe down gesture
    const joystickController = page.locator('[data-testid="joystick-controller"]');
    const box = await joystickController.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 100, { steps: 10 });
      await page.mouse.up();
    }

    // Wait for movement animation
    await page.waitForTimeout(500);

    // Take post-swipe screenshot
    await page.screenshot({ path: 'tests/screenshots/debug-after-swipe.png', fullPage: true });

    // Get new grid position
    const newRow = await character.getAttribute('data-grid-row');
    const newCol = await character.getAttribute('data-grid-col');
    console.log('New grid position:', { row: newRow, col: newCol });

    // Get new map transform
    const newTransform = await mapContainer.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    console.log('New map transform:', newTransform);

    // Print all console logs
    console.log('\n=== Console Logs ===');
    consoleLogs.forEach(log => console.log(log));

    // Verify character exists and has correct attributes
    await expect(character).toBeVisible();
    expect(initialRow).toBeTruthy();
    expect(initialCol).toBeTruthy();

    // Check if position changed after swipe
    console.log('\nPosition changed:', initialRow !== newRow || initialCol !== newCol);
    console.log('Transform changed:', initialTransform !== newTransform);
  });
});
