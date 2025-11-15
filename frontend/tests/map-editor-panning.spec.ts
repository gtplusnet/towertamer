import { test, expect } from '@playwright/test';

test.describe('Map Editor Panning', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));

    // Listen for page errors
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    // Navigate to the app
    await page.goto('http://100.121.246.85:4024');

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Login as developer
    const loginButton = page.locator('button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();

      // Fill in login form
      await page.fill('input[type="text"], input[placeholder*="name"], input[placeholder*="email"]', 'developer');
      await page.fill('input[type="password"]', 'water123');

      // Submit login
      await page.click('button:has-text("Login")');

      // Wait for login to complete
      await page.waitForTimeout(2000);
    }
  });

  test('should navigate to map editor and test panning', async ({ page }) => {
    // Navigate to map editor - try different possible routes
    const mapEditorLink = page.locator('a:has-text("Map Editor"), a[href*="editor"], button:has-text("Map Editor")').first();

    if (await mapEditorLink.isVisible()) {
      await mapEditorLink.click();
    } else {
      // Try direct navigation
      await page.goto('http://100.121.246.85:4024/map-editor');
    }

    // Wait for map editor to load
    await page.waitForTimeout(2000);

    // Look for a map in the sidebar or create a new one
    const mapListItem = page.locator('[class*="sidebar"] div, [class*="leftSidebar"] div').filter({ hasText: /\d+\s*x\s*\d+/ }).first();

    if (await mapListItem.isVisible()) {
      console.log('Found existing map, clicking it...');
      await mapListItem.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('No map found, looking for create button...');
      const createButton = page.locator('button:has-text("Create")').first();
      if (await createButton.isVisible()) {
        await createButton.click();

        // Fill in map creation dialogs
        await page.waitForTimeout(500);
        // The prompts will appear, but we need to handle them differently
      }
    }

    // Wait for canvas to render - look for tiles being rendered
    await page.waitForTimeout(3000);

    // Find the scrollable canvas container with tiles
    // It should be the one from MapEditorCanvas component with overflow: auto
    let canvasContainer = page.locator('[class*="MapEditorCanvas"][class*="canvasContainer"]').first();
    let count = await canvasContainer.count();

    if (count === 0) {
      // Try to find any canvasContainer with the canvas class inside
      canvasContainer = page.locator('div[class*="canvasContainer"]').filter({ has: page.locator('[class*="canvas"]') }).first();
      count = await canvasContainer.count();
      console.log('Found container with canvas div:', count);
    }

    if (count === 0) {
      // Just use any container with overflow
      canvasContainer = page.locator('div[class*="canvasContainer"]').first();
      count = await canvasContainer.count();
      console.log('Using first canvasContainer:', count);
    }

    // Check if tiles are actually rendered
    const tileCount = await page.locator('[class*="tile"]').count();
    console.log('Number of tiles rendered:', tileCount);

    // Check the parent of a tile - this should be the canvas div
    const firstTile = page.locator('[class*="tile"]').first();
    const tileParentInfo = await firstTile.evaluate(el => {
      const parent = el.parentElement;
      return {
        className: parent?.className || 'NO PARENT',
        width: (parent as HTMLElement)?.style.width || 'no width style',
        height: (parent as HTMLElement)?.style.height || 'no height style',
        computedWidth: parent ? window.getComputedStyle(parent).width : 'N/A',
        computedHeight: parent ? window.getComputedStyle(parent).height : 'N/A'
      };
    });
    console.log('Tile parent (canvas div) info:', tileParentInfo);

    // Find the actual canvas div that contains the tiles
    const actualCanvasDiv = page.locator('[class*="MapEditorCanvas"][class*="canvas"]:not([class*="Container"])').first();
    let actualCanvasCount = await actualCanvasDiv.count();

    if (actualCanvasCount === 0) {
      // Try different selector - the div that has tiles as direct children
      const canvasWithTiles = page.locator('div[class*="canvas"]').filter({ has: page.locator('[class*="tile"]') }).first();
      actualCanvasCount = await canvasWithTiles.count();
      console.log('Canvas with tiles count:', actualCanvasCount);

      if (actualCanvasCount > 0) {
        const tilesCanvasBox = await canvasWithTiles.boundingBox();
        console.log('Canvas with tiles box:', tilesCanvasBox);

        const tilesCanvasStyles = await canvasWithTiles.evaluate(el => ({
          width: (el as HTMLElement).style.width,
          height: (el as HTMLElement).style.height,
          className: el.className
        }));
        console.log('Canvas with tiles styles:', tilesCanvasStyles);
      }
    }

    // Find the ACTUAL scrollable container - the one with overflow: auto
    // There are TWO canvasContainers - one from MapEditorPage and one from MapEditorCanvas
    // We need the MapEditorCanvas one which has overflow: auto
    const allCanvasContainers = await page.locator('div[class*="canvasContainer"]').all();
    console.log('Number of canvasContainer divs:', allCanvasContainers.length);

    let scrollableContainer = null;
    for (const container of allCanvasContainers) {
      const overflow = await container.evaluate(el => window.getComputedStyle(el).overflow);
      const className = await container.evaluate(el => el.className);
      console.log(`Container ${className}: overflow=${overflow}`);

      if (overflow === 'auto') {
        scrollableContainer = container;
        break;
      }
    }

    if (!scrollableContainer) {
      throw new Error('Could not find scrollable container with overflow: auto');
    }

    const scrollableBox = await scrollableContainer.boundingBox();
    console.log('Scrollable container box:', scrollableBox);

    const scrollableInfo = await scrollableContainer.evaluate(el => ({
      className: el.className,
      overflow: window.getComputedStyle(el).overflow,
      scrollWidth: el.scrollWidth,
      scrollHeight: el.scrollHeight,
      clientWidth: el.clientWidth,
      clientHeight: el.clientHeight
    }));
    console.log('Scrollable container info:', scrollableInfo);

    // Take screenshot
    await page.screenshot({ path: '/home/developer/projects/towertamer/debug/map-editor-before-pan.png', fullPage: true });

    // Use the scrollable container for panning tests
    const box = scrollableBox;

    if (!box) {
      throw new Error('Scrollable container not found');
    }

    // Get initial scroll position
    const initialScrollLeft = await scrollableContainer.evaluate(el => el.scrollLeft);
    const initialScrollTop = await scrollableContainer.evaluate(el => el.scrollTop);
    console.log('Initial scroll position:', { left: initialScrollLeft, top: initialScrollTop });

    // Test middle mouse button panning
    console.log('Testing middle mouse button drag...');

    // Start position (center of canvas)
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    // Drag right and down
    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: 'middle' });
    await page.waitForTimeout(100);

    // Move 100px right and 100px down
    await page.mouse.move(startX + 100, startY + 100, { steps: 10 });
    await page.waitForTimeout(100);

    await page.mouse.up({ button: 'middle' });
    await page.waitForTimeout(500);

    // Check scroll position changed
    const afterMiddleDragScrollLeft = await scrollableContainer.evaluate(el => el.scrollLeft);
    const afterMiddleDragScrollTop = await scrollableContainer.evaluate(el => el.scrollTop);
    console.log('After middle drag scroll position:', { left: afterMiddleDragScrollLeft, top: afterMiddleDragScrollTop });

    // Scroll should have moved left (negative X direction) and up (negative Y direction)
    // Because dragging right should scroll left
    console.log('Scroll delta:', {
      left: afterMiddleDragScrollLeft - initialScrollLeft,
      top: afterMiddleDragScrollTop - initialScrollTop
    });

    // Test spacebar + drag panning
    console.log('Testing spacebar + drag...');

    const beforeSpaceScrollLeft = afterMiddleDragScrollLeft;
    const beforeSpaceScrollTop = afterMiddleDragScrollTop;

    // Press space
    await page.keyboard.down('Space');
    await page.waitForTimeout(100);

    // Move to start position
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.waitForTimeout(100);

    // Drag up and left
    await page.mouse.move(startX - 100, startY - 100, { steps: 10 });
    await page.waitForTimeout(100);

    await page.mouse.up();
    await page.keyboard.up('Space');
    await page.waitForTimeout(500);

    // Check scroll position changed
    const afterSpaceDragScrollLeft = await scrollableContainer.evaluate(el => el.scrollLeft);
    const afterSpaceDragScrollTop = await scrollableContainer.evaluate(el => el.scrollTop);
    console.log('After space+drag scroll position:', { left: afterSpaceDragScrollLeft, top: afterSpaceDragScrollTop });

    console.log('Scroll delta from space drag:', {
      left: afterSpaceDragScrollLeft - beforeSpaceScrollLeft,
      top: afterSpaceDragScrollTop - beforeSpaceScrollTop
    });

    // Take a screenshot
    await page.screenshot({ path: '/home/developer/projects/towertamer/debug/map-editor-panning-test.png', fullPage: true });

    // Check if vertical panning worked
    const verticalPanWorked = Math.abs(afterMiddleDragScrollTop - initialScrollTop) > 10 ||
                             Math.abs(afterSpaceDragScrollTop - beforeSpaceScrollTop) > 10;

    console.log('Vertical pan worked:', verticalPanWorked);

    if (!verticalPanWorked) {
      console.error('VERTICAL PANNING FAILED - scrollTop did not change significantly');
    }
  });
});
