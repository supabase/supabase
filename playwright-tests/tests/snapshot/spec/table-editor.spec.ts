import { expect, test } from '@playwright/test'

test.describe('Table Editor page', () => {
  test('should create a column and insert a row', async ({ page }) => {
    const name = 'TestTable' + Math.floor(Math.random() * 10)

    await page.goto('/project/default/editor')
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    // need to wait for the panel animation
    await page.waitForTimeout(1000)
    await page.locator('.col-span-8 > div > .relative > .peer\\/input').first().click()
    await page.locator('.col-span-8 > div > .relative > .peer\\/input').first().fill(name)
    await page.getByRole('button', { name: 'Add column' }).click()
    await page.getByRole('textbox', { name: 'column_name' }).click()
    await page.getByRole('textbox', { name: 'column_name' }).fill('textColumn')
    await page.getByRole('button', { name: '---' }).click()
    await page.getByText('textVariable-length character').click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Save' }).click()
    await page.locator('#toast').getByRole('button').click()
    await page.getByRole('link', { name }).click()
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByText('Insert a new row into').click()
    await page.getByPlaceholder('NULL').click()
    await page.getByPlaceholder('NULL').fill('some text')
    await page.getByTestId('action-bar-save-row').click()
    await page.locator('#toast').getByRole('button').click()
    await expect(page.getByRole('grid')).toContainText('some text')
  })
})
