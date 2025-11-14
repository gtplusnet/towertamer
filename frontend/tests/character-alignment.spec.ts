import { test, expect } from '@playwright/test';

test('character should be centered in tile', async ({ page }) => {
  await page.goto('http://localhost:4024');

  // Wait for map to load
  await page.waitForSelector('[data-testid="game-map"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="character"]', { timeout: 5000 });

  // Get the character canvas (actual sprite)
  const canvas = await page.locator('[data-testid="character-canvas"]');
  const canvasBox = await canvas.boundingBox();

  // Get character grid position
  const character = await page.locator('[data-testid="character"]');
  const gridRow = await character.getAttribute('data-grid-row');
  const gridCol = await character.getAttribute('data-grid-col');

  console.log('Character at grid position:', { row: gridRow, col: gridCol });
  console.log('Character canvas box:', canvasBox);

  // Get map container to calculate camera offset
  const mapContainer = await page.locator('[data-testid="map-container"]');
  const transform = await mapContainer.evaluate((el) => {
    return window.getComputedStyle(el).transform;
  });
  console.log('Map transform:', transform);

  // Extract translation values from transform matrix
  // matrix(1, 0, 0, 1, tx, ty) where tx and ty are the translate values
  const matches = transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+),\s*([^)]+)\)/);
  const cameraX = matches ? parseFloat(matches[1]) : 0;
  const cameraY = matches ? parseFloat(matches[2]) : 0;

  console.log('Camera offset:', { x: cameraX, y: cameraY });

  // Calculate where the tile center should be in world coordinates
  // Tiles are 48x48px, positioned absolutely
  const expectedTileX = parseInt(gridCol!) * 48;
  const expectedTileY = parseInt(gridRow!) * 48;
  const expectedTileCenterX = expectedTileX + 24; // Center of tile
  const expectedTileCenterY = expectedTileY + 24;

  console.log('Expected tile center (world coords):', { x: expectedTileCenterX, y: expectedTileCenterY });

  // Calculate where tile center should appear in viewport
  // viewport_position = world_position + camera_offset
  const expectedTileCenterViewportX = expectedTileCenterX + cameraX;
  const expectedTileCenterViewportY = expectedTileCenterY + cameraY;

  console.log('Expected tile center (viewport coords):', { x: expectedTileCenterViewportX, y: expectedTileCenterViewportY });

  if (canvasBox) {
    // Canvas center in viewport
    const canvasCenterX = canvasBox.x + canvasBox.width / 2;
    const canvasCenterY = canvasBox.y + canvasBox.height / 2;

    const offsetX = canvasCenterX - expectedTileCenterViewportX;
    const offsetY = canvasCenterY - expectedTileCenterViewportY;

    console.log('Canvas center (viewport):', { x: canvasCenterX, y: canvasCenterY });
    console.log('Canvas offset from tile center:', { x: offsetX, y: offsetY });

    // Character canvas should be centered on its tile
    // Allow up to 2px tolerance for rounding
    expect(Math.abs(offsetX)).toBeLessThan(2);
    expect(Math.abs(offsetY)).toBeLessThan(2);
  }
});
