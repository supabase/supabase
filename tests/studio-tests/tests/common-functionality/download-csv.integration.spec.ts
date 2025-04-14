import { test, expect } from '@playwright/test';
import fs from 'fs/promises';

test('CSV Export: verify escaped quotes', async ({ page }) => {
  // Navigate to your application page—adjust this URL as needed.
  await page.goto('http://localhost:8082/project/default/sql/1');

  // Wait for the Export button to appear (using its accessible name).
  const exportButton = page.getByRole('button', { name: /export/i });
  await expect(exportButton).toBeVisible({ timeout: 5000 });

  // Click the Export button.
  await exportButton.click();

  // Click the "Download CSV" option and wait for the download event.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByText(/Download CSV/i).click()
  ]);

  // When the download is complete, read its content.
  const filePath = await download.path();
  const csvContent = await fs.readFile(filePath!, { encoding: 'utf8' });

  // Verify that the CSV output contains properly escaped quotes.
  // For example, if your exported CSV should include: He said "Hello"
  // then it should actually contain: He said ""Hello""
  expect(csvContent).toContain('He said ""Hello""');
});
