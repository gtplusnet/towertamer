import { test, expect } from '@playwright/test';

test.describe('Tower Tamer RPG - Character Movement', () => {
  test('should move character up on swipe up', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Get initial character grid position
    const character = page.getByTestId('character');
    const initialRow = parseInt(await character.getAttribute('data-grid-row') || '0', 10);

    // Simulate swipe up gesture
    await page.mouse.move(200, 400);
    await page.mouse.down();
    await page.mouse.move(200, 300);
    await page.mouse.up();

    // Wait for animation
    await page.waitForTimeout(300);

    // Get new grid position
    const newRow = parseInt(await character.getAttribute('data-grid-row') || '0', 10);

    // Character should have moved up (row decreased)
    expect(newRow).toBeLessThan(initialRow);
  });

  test('should move character down on swipe down', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');
    const initialRow = parseInt(await character.getAttribute('data-grid-row') || '0', 10);

    // Simulate swipe down
    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(200, 400);
    await page.mouse.up();
    await page.waitForTimeout(300);

    const newRow = parseInt(await character.getAttribute('data-grid-row') || '0', 10);

    // Character should have moved down (row increased)
    expect(newRow).toBeGreaterThan(initialRow);
  });

  test('should move character left on swipe left', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');
    const initialCol = parseInt(await character.getAttribute('data-grid-col') || '0', 10);

    // Simulate swipe left
    await page.mouse.move(250, 350);
    await page.mouse.down();
    await page.mouse.move(150, 350);
    await page.mouse.up();
    await page.waitForTimeout(300);

    const newCol = parseInt(await character.getAttribute('data-grid-col') || '0', 10);

    // Character should have moved left (col decreased)
    expect(newCol).toBeLessThan(initialCol);
  });

  test('should move character right on swipe right', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');
    const initialCol = parseInt(await character.getAttribute('data-grid-col') || '0', 10);

    // Simulate swipe right
    await page.mouse.move(150, 350);
    await page.mouse.down();
    await page.mouse.move(250, 350);
    await page.mouse.up();
    await page.waitForTimeout(300);

    const newCol = parseInt(await character.getAttribute('data-grid-col') || '0', 10);

    // Character should have moved right (col increased)
    expect(newCol).toBeGreaterThan(initialCol);
  });

  test('should respect boundary constraints', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');

    // Try to move beyond top boundary multiple times
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(200, 400);
      await page.mouse.down();
      await page.mouse.move(200, 100);
      await page.mouse.up();
      await page.waitForTimeout(250);
    }

    const row = parseInt(await character.getAttribute('data-grid-row') || '0', 10);

    // Character row should not be less than 0 (top boundary)
    expect(row).toBeGreaterThanOrEqual(0);
  });
});
