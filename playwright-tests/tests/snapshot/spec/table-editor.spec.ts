import { Page, expect, test } from '@playwright/test'

const dismissToast = async (page: Page) => {
  await page.locator('#toast').getByRole('button').waitFor({ state: 'visible' })
  await page.locator('#toast').getByRole('button').click()
}

test.describe('Table Editor page', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    const tableResponsePromise = page.waitForResponse(
      'http://localhost:8082/api/pg-meta/default/query?key=public-entity-types',
      { timeout: 0 }
    )
    await page.goto('/project/default/editor')
    await tableResponsePromise
  })

  test('should create a column and insert a row', async ({ page }, testInfo) => {
    // given
    const tableName = `${testInfo.testId.slice(0, 10)}-${testInfo.retry}`

    //when
    // The page has been loaded with the table data, we can now interact with the page
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await page
      .locator('.col-span-8 > div > .relative > .peer\\/input')
      .first()
      .waitFor({ state: 'visible' })
    await page.locator('.col-span-8 > div > .relative > .peer\\/input').first().click()
    await page.locator('.col-span-8 > div > .relative > .peer\\/input').first().fill(tableName)
    await page.getByRole('button', { name: 'Add column' }).click()
    await page.getByRole('textbox', { name: 'column_name' }).click()
    await page.getByRole('textbox', { name: 'column_name' }).fill('textColumn')
    await page.getByRole('button', { name: '---' }).click()
    await page.getByText('textVariable-length character').click()
    await page.getByRole('button', { name: 'Save' }).waitFor({ state: 'visible' })
    await page.getByRole('button', { name: 'Save' }).click()
    await dismissToast(page)

    await page.getByRole('button', { name: tableName }).click()
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByText('Insert a new row into').click()
    await page.getByPlaceholder('NULL').click()
    await page.getByPlaceholder('NULL').fill('some text')
    await page.getByTestId('action-bar-save-row').click()
    await dismissToast(page)

    // then
    await expect(page.getByRole('grid')).toContainText('some text')
  })
})
