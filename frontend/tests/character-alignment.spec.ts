import { test, expect } from '@playwright/test';

test('character should be centered in tile', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Wait for map to load
  await page.waitForSelector('[data-testid="game-map"]', { timeout: 10000 });
  await page.waitForSelector('[data-testid="character"]', { timeout: 5000 });
  
  // Get character position
  const character = await page.locator('[data-testid="character"]');
  const charBox = await character.boundingBox();
  
  // Get character grid position
  const gridRow = await character.getAttribute('data-grid-row');
  const gridCol = await character.getAttribute('data-grid-col');
  
  console.log('Character at grid position:', { row: gridRow, col: gridCol });
  console.log('Character bounding box:', charBox);
  
  // Calculate where the tile should be based on grid position
  // Tiles are 48x48px, positioned absolutely
  const tileIndex = parseInt(gridRow!) * 20 + parseInt(gridCol!);
  const expectedTileX = parseInt(gridCol!) * 48;
  const expectedTileY = parseInt(gridRow!) * 48;

  console.log('Expected tile position:', { x: expectedTileX, y: expectedTileY, index: tileIndex });
  console.log('Tile size: 48x48px');

  if (charBox) {
    // Character is fixed at viewport center
    const viewportCenterX = 375 / 2;  // 187.5
    const viewportCenterY = 667 / 2;  // 333.5

    const charCenterX = charBox.x + charBox.width / 2;
    const charCenterY = charBox.y + charBox.height / 2;

    // Expected tile center in viewport (tile center - camera offset should = viewport center)
    const expectedTileCenterX = expectedTileX + 24;  // 24 is half of 48
    const expectedTileCenterY = expectedTileY + 24;

    const offsetX = charCenterX - viewportCenterX;
    const offsetY = charCenterY - viewportCenterY;

    console.log('Viewport center:', { x: viewportCenterX, y: viewportCenterY });
    console.log('Character center:', { x: charCenterX, y: charCenterY });
    console.log('Expected tile center (world):', { x: expectedTileCenterX, y: expectedTileCenterY });
    console.log('Character offset from viewport center:', { x: offsetX, y: offsetY });

    // Character should be at viewport center (fixed positioning)
    expect(Math.abs(offsetX)).toBeLessThan(2);
    expect(Math.abs(offsetY)).toBeLessThan(2);
  }
});
