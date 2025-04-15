import { test, expect } from '@playwright/test';
import fs from 'fs/promises';

test('CSV Export: verify escaped quotes', async ({ page }) => {
  // Navigate to the SQL page.
  await page.goto('http://localhost:8082/project/default/sql/1');

  // Wait for any asynchronous processes to finish.
  await page.waitForLoadState('networkidle');

  // --- Interact with the custom SQL editor ---
  // Using codegen selectors; adjust timeouts as needed.
  await page.locator('section')
    .getByRole('code')
    .locator('div')
    .filter({ hasText: '(select version()) as version,' })
    .nth(4)
    .click({ timeout: 15000 });

  await page.locator('section')
    .getByRole('code')
    .locator('div')
    .filter({ hasText: '(select current_setting(\'' })
    .nth(4)
    .click({ timeout: 15000 });
  await page.locator('section')
    .getByRole('code')
    .locator('div')
    .filter({ hasText: '(select current_setting(\'' })
    .nth(4)
    .click({ timeout: 15000 });
  await page.locator('section')
    .getByRole('code')
    .locator('div')
    .filter({ hasText: '(select current_setting(\'' })
    .nth(4)
    .click({ timeout: 15000 });

  // Use arrow keys to ensure the editor is in focus.
  for (let i = 0; i < 8; i++) {
    await page.getByLabel('Editor content;Press Alt+F1').press('ArrowRight');
  }

  // Clear the editor and type in the query.
  await page.getByLabel('Editor content;Press Alt+F1').press('Meta+A'); // or 'Control+A' on Windows
  await page.keyboard.press('Backspace');
  const query = 'SELECT \'He said "Hello"\' AS greeting;';
  await page.keyboard.type(query);

  // --- Run the Query ---
  const runButton = page.getByRole('button', { name: 'Run', exact: true });
  await expect(runButton).toBeVisible({ timeout: 15000 });
  await runButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000); // allow any animations/processing to complete
  await runButton.click({ timeout: 15000 });

  // --- Wait for Query Results ---
  // Instead of waiting for the full text, wait for "Hello" to appear.
  const resultLocator = page.locator('text=Hello');
  await expect(resultLocator).toBeVisible({ timeout: 20000 });

  // --- Export and Download CSV ---
  const exportButton = page.getByRole('button', { name: 'Export' });
  await expect(exportButton).toBeVisible({ timeout: 10000 });
  await exportButton.click();

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.getByText('Download CSV').click({ timeout: 10000 })
  ]);

  // --- Verify CSV Content ---
  const filePath = await download.path();
  const csvContent = await fs.readFile(filePath!, 'utf8');

  // Expect CSV to escape quotes: He said "Hello" should be exported as He said ""Hello""
  expect(csvContent).toContain('He said ""Hello""');
});
