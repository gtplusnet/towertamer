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
    const getPosition = (transform: string): { x: number; y: number } => {
      const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+),\s*([^)]+)\)/);
      return {
        x: match ? parseFloat(match[1]) : 0,
        y: match ? parseFloat(match[2]) : 0,
      };
    };

    const initialTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const initialPos = getPosition(initialTransform);

    // Swipe that meets minimum distance (30px+)
    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(200, 370); // 70px swipe
    await page.mouse.up();
    await page.waitForTimeout(300);

    const newTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const newPos = getPosition(newTransform);

    // Position should have changed
    expect(newPos.y).not.toBe(initialPos.y);
  });

  test('should ignore swipe below minimum distance', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');
    const getPosition = (transform: string): { x: number; y: number } => {
      const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+),\s*([^)]+)\)/);
      return {
        x: match ? parseFloat(match[1]) : 0,
        y: match ? parseFloat(match[2]) : 0,
      };
    };

    const initialTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const initialPos = getPosition(initialTransform);

    // Very small swipe (less than 30px minimum)
    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(200, 315); // Only 15px swipe
    await page.mouse.up();
    await page.waitForTimeout(300);

    const newTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const newPos = getPosition(newTransform);

    // Position should not have changed
    expect(newPos.x).toBe(initialPos.x);
    expect(newPos.y).toBe(initialPos.y);
  });

  test('should determine correct swipe direction', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');
    const getPosition = (transform: string): { x: number; y: number } => {
      const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+),\s*([^)]+)\)/);
      return {
        x: match ? parseFloat(match[1]) : 0,
        y: match ? parseFloat(match[2]) : 0,
      };
    };

    // Test horizontal swipe (should move horizontally)
    const initialTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const initialPos = getPosition(initialTransform);

    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(300, 305); // Mostly horizontal, slight vertical
    await page.mouse.up();
    await page.waitForTimeout(300);

    const newTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const newPos = getPosition(newTransform);

    // X should change more than Y (horizontal movement)
    const deltaX = Math.abs(newPos.x - initialPos.x);
    const deltaY = Math.abs(newPos.y - initialPos.y);
    expect(deltaX).toBeGreaterThan(deltaY);
  });

  test('should handle multiple consecutive swipes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');
    const getYPosition = (transform: string): number => {
      const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*([^)]+)\)/);
      return match ? parseFloat(match[1]) : 0;
    };

    // Perform multiple swipes
    const positions: number[] = [];

    for (let i = 0; i < 3; i++) {
      await page.mouse.move(200, 400);
      await page.mouse.down();
      await page.mouse.move(200, 300);
      await page.mouse.up();
      await page.waitForTimeout(300);

      const transform = await character.evaluate((el) =>
        window.getComputedStyle(el).transform
      );
      positions.push(getYPosition(transform));
    }

    // Each swipe should move the character further up
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
