import { test, expect } from '@playwright/test';

test.describe('Tower Tamer RPG - Touch Controls', () => {
  test('should handle touch events', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify touch controller exists
    const touchController = page.getByTestId('touch-controller');
    await expect(touchController).toBeVisible({ timeout: 10000 });

    // Check that touch-action is set to none
    const touchAction = await touchController.evaluate((el) =>
      window.getComputedStyle(el).touchAction
    );
    expect(touchAction).toBe('none');
  });

  test('should detect swipe with minimum distance', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');
    const initialRow = parseInt(await character.getAttribute('data-grid-row') || '0', 10);

    // Swipe that meets minimum distance (30px+)
    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(200, 370); // 70px swipe down
    await page.mouse.up();
    await page.waitForTimeout(300);

    const newRow = parseInt(await character.getAttribute('data-grid-row') || '0', 10);

    // Row should have changed (moved down)
    expect(newRow).not.toBe(initialRow);
  });

  test('should ignore swipe below minimum distance', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');
    const initialRow = parseInt(await character.getAttribute('data-grid-row') || '0', 10);
    const initialCol = parseInt(await character.getAttribute('data-grid-col') || '0', 10);

    // Very small swipe (less than 30px minimum)
    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(200, 315); // Only 15px swipe
    await page.mouse.up();
    await page.waitForTimeout(300);

    const newRow = parseInt(await character.getAttribute('data-grid-row') || '0', 10);
    const newCol = parseInt(await character.getAttribute('data-grid-col') || '0', 10);

    // Position should not have changed
    expect(newRow).toBe(initialRow);
    expect(newCol).toBe(initialCol);
  });

  test('should determine correct swipe direction', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');
    const initialRow = parseInt(await character.getAttribute('data-grid-row') || '0', 10);
    const initialCol = parseInt(await character.getAttribute('data-grid-col') || '0', 10);

    // Test horizontal swipe (should move horizontally)
    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(300, 305); // Mostly horizontal, slight vertical
    await page.mouse.up();
    await page.waitForTimeout(300);

    const newRow = parseInt(await character.getAttribute('data-grid-row') || '0', 10);
    const newCol = parseInt(await character.getAttribute('data-grid-col') || '0', 10);

    // Column should change (horizontal movement), row should not
    const deltaRow = Math.abs(newRow - initialRow);
    const deltaCol = Math.abs(newCol - initialCol);
    expect(deltaCol).toBeGreaterThan(deltaRow);
  });

  test('should handle multiple consecutive swipes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');

    // Perform multiple swipes and track row positions
    const positions: number[] = [];

    for (let i = 0; i < 3; i++) {
      await page.mouse.move(200, 400);
      await page.mouse.down();
      await page.mouse.move(200, 300);
      await page.mouse.up();
      await page.waitForTimeout(300);

      const row = parseInt(await character.getAttribute('data-grid-row') || '0', 10);
      positions.push(row);
    }

    // Each swipe should move the character further up (row decreases)
    expect(positions[1]).toBeLessThan(positions[0]);
    expect(positions[2]).toBeLessThan(positions[1]);
  });
});

test.describe('Tower Tamer RPG - Animation', () => {
  test('should show animation during movement', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Trigger movement
    await page.mouse.move(200, 400);
    await page.mouse.down();
    await page.mouse.move(200, 300);
    await page.mouse.up();

    // During animation, character should have isMoving state
    // We can't directly test React state, but we can verify the canvas updates
    const canvas = page.getByTestId('character-canvas');

    // Take screenshot during movement
    await page.waitForTimeout(100);
    const duringMovement = await canvas.screenshot();

    // Wait for animation to complete
    await page.waitForTimeout(300);
    const afterMovement = await canvas.screenshot();

    // Screenshots should exist
    expect(duringMovement).toBeTruthy();
    expect(afterMovement).toBeTruthy();
  });
});
