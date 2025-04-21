import { test, expect } from '@playwright/test';
import fs from 'fs/promises';

test('CSV Export: verify escaped quotes', async ({ page }) => {
  // Navigate to the SQL page.
  await page.goto('http://localhost:8082/project/default/sql/1');

  // --- Interact with the custom SQL editor ---
  await page.locator('section')
    .getByRole('code')
    .locator('div')
    .filter({ hasText: '(select version()) as version,' })
    .nth(4)
    .click();
  await page.locator('section')
    .getByRole('code')
    .locator('div')
    .filter({ hasText: '(select current_setting(\'' })
    .nth(4)
    .click();
  await page.locator('section')
    .getByRole('code')
    .locator('div')
    .filter({ hasText: '(select current_setting(\'' })
    .nth(4)
    .click();
  await page.locator('section')
    .getByRole('code')
    .locator('div')
    .filter({ hasText: '(select current_setting(\'' })
    .nth(4)
    .click();

  // Use arrow keys to ensure the editor has focus.
  for (let i = 0; i < 8; i++) {
    await page.getByLabel('Editor content;Press Alt+F1').press('ArrowRight');
  }

  // Clear the editor and type in the query.
  await page.getByLabel('Editor content;Press Alt+F1').press('Meta+A'); // or 'Control+A'
  await page.keyboard.press('Backspace');
  await page.keyboard.type('SELECT \'He said "Hello"\' AS greeting;');

  // --- Run the Query ---
  await page.getByRole('button', { name: 'Run', exact: true }).click();

  // --- Export and Download CSV ---
  await page.getByRole('button', { name: 'Export' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByText('Download CSV').click()
  ]);

  // --- Verify CSV Content ---
  const filePath = await download.path();
  const csvContent = await fs.readFile(filePath!, 'utf8');
  expect(csvContent).toContain('He said ""Hello""');
});
