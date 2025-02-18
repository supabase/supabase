import { test, expect } from '@playwright/test'

const LOGS_PAGES = [
  'API Gateway',
  'Postgres',
  'PostgREST',
  // 'Auth', Wont have logs on first load
  // 'Storage', Wont have logs on first load
  //'Realtime' Wont have logs on first load
]

test.describe('Logs', async () => {
  for (const logPage of LOGS_PAGES) {
    test.describe(`${logPage} logs page`, () => {
      test('can navigate to logs page', async ({ page }) => {
        await page.goto('http://localhost:8082/project/default')
        await page.locator('a', { hasText: 'Logs' }).click({ timeout: 4000 })
        await expect(page.getByText('Logs & Analytics')).toBeVisible()

        // Click anywhere on the screen to close the sidebar
        await page.click('body')

        await page
          .getByRole('link', { name: logPage, exact: true })
          .click()
          .catch((e) => {
            console.log('🔴 Error clicking', logPage, e)
            throw e
          })

        // Wait for and verify the logs table is present
        const logsTable = page.getByRole('table')
        await expect(logsTable).toBeVisible()
      })

      test('shows logs data without errors', async ({ page }) => {
        // Navigate to page first
        await page.goto('http://localhost:8082/project/default')
        await page.locator('a', { hasText: 'Logs' }).click({ timeout: 4000 })
        await page.click('body')
        await page.getByRole('link', { name: logPage, exact: true }).click()

        // Wait a bit and check for errors with a longer timeout
        const error = page.getByText('Error fetching logs')
        await expect(error).not.toBeVisible({ timeout: 10000 })

        // Check if the logs table has any rows
        const gridcells = page.getByRole('gridcell')
        await expect(gridcells.first()).toBeVisible()
      })

      test('can select and view log details', async ({ page }) => {
        // Navigate to page first
        await page.goto('http://localhost:8082/project/default')
        await page.locator('a', { hasText: 'Logs' }).click({ timeout: 4000 })
        await page.click('body')
        await page.getByRole('link', { name: logPage, exact: true }).click()

        const gridcells = page.getByRole('gridcell')

        // Click first row and verify details
        await gridcells.first().click()
        const tabPanel = page.getByTestId('log-selection')
        await expect(tabPanel).toBeVisible({ timeout: 2000 })

        const selectionPanelTimestamp = tabPanel.getByTestId('log-selection-timestamp')
        await expect(selectionPanelTimestamp).toBeVisible()

        const rawTimestamp = await selectionPanelTimestamp.textContent()
        const timestamp = rawTimestamp?.replace('timestamp', '')
        const rowText = await gridcells.first().textContent()
        expect(rowText).toContain(timestamp)

        // Click second row and verify different content
        await gridcells.nth(1).click()
        const tabPanelText2 = await tabPanel.textContent()
        expect(tabPanelText2).not.toBe(rowText)
      })
    })
  }
})
