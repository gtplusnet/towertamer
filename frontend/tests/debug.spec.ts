import { test, expect } from '@playwright/test';

test('debug - check page content and console', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  // Capture console messages
  page.on('console', (msg) => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  await page.goto('/', { waitUntil: 'networkidle' });

  // Wait a bit for React to hydrate
  await page.waitForTimeout(3000);

  // Get the page HTML
  const html = await page.content();
  console.log('=== PAGE HTML ===');
  console.log(html);

  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => console.log(msg));

  console.log('\n=== ERRORS ===');
  errors.forEach(err => console.log(err));

  // Check if root div has children
  const rootHtml = await page.locator('#root').innerHTML();
  console.log('\n=== ROOT DIV CONTENT ===');
  console.log(rootHtml);

  // This test always passes - it's just for debugging
  expect(true).toBe(true);
});
