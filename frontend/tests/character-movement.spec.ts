import { test, expect } from '@playwright/test';

test.describe('Tower Tamer RPG - Character Movement', () => {
  test('should move character up on swipe up', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Get initial character position
    const character = page.getByTestId('character');
    const initialTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );

    // Extract Y position from transform matrix
    const getYPosition = (transform: string): number => {
      const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*([^)]+)\)/);
      return match ? parseFloat(match[1]) : 0;
    };

    const initialY = getYPosition(initialTransform);

    // Simulate swipe up gesture
    await page.touchscreen.tap(200, 400);
    await page.waitForTimeout(50);
    await page.mouse.move(200, 400);
    await page.mouse.down();
    await page.mouse.move(200, 300);
    await page.mouse.up();

    // Wait for animation
    await page.waitForTimeout(300);

    // Get new position
    const newTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const newY = getYPosition(newTransform);

    // Character should have moved up (Y decreased)
    expect(newY).toBeLessThan(initialY);
  });

  test('should move character down on swipe down', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');
    const getYPosition = (transform: string): number => {
      const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*([^)]+)\)/);
      return match ? parseFloat(match[1]) : 0;
    };

    const initialTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const initialY = getYPosition(initialTransform);

    // Simulate swipe down
    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(200, 400);
    await page.mouse.up();
    await page.waitForTimeout(300);

    const newTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const newY = getYPosition(newTransform);

    // Character should have moved down (Y increased)
    expect(newY).toBeGreaterThan(initialY);
  });

  test('should move character left on swipe left', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');
    const getXPosition = (transform: string): number => {
      const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+)/);
      return match ? parseFloat(match[1]) : 0;
    };

    const initialTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const initialX = getXPosition(initialTransform);

    // Simulate swipe left
    await page.mouse.move(250, 350);
    await page.mouse.down();
    await page.mouse.move(150, 350);
    await page.mouse.up();
    await page.waitForTimeout(300);

    const newTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const newX = getXPosition(newTransform);

    // Character should have moved left (X decreased)
    expect(newX).toBeLessThan(initialX);
  });

  test('should move character right on swipe right', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const character = page.getByTestId('character');
    const getXPosition = (transform: string): number => {
      const match = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+)/);
      return match ? parseFloat(match[1]) : 0;
    };

    const initialTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const initialX = getXPosition(initialTransform);

    // Simulate swipe right
    await page.mouse.move(150, 350);
    await page.mouse.down();
    await page.mouse.move(250, 350);
    await page.mouse.up();
    await page.waitForTimeout(300);

    const newTransform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const newX = getXPosition(newTransform);

    // Character should have moved right (X increased)
    expect(newX).toBeGreaterThan(initialX);
  });

  test('should respect boundary constraints', async ({ page }) => {
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

    // Try to move beyond top boundary multiple times
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(200, 400);
      await page.mouse.down();
      await page.mouse.move(200, 100);
      await page.mouse.up();
      await page.waitForTimeout(250);
    }

    const transform = await character.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    const position = getPosition(transform);

    // Character Y should not be less than 0 (top boundary)
    expect(position.y).toBeGreaterThanOrEqual(0);
  });
});
