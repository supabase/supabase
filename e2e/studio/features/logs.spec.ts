import { expect } from '@playwright/test'
import { test } from '../utils/test'

const LOGS_PAGES = [
  { label: 'API Gateway', route: 'edge-logs' },
  { label: 'Postgres', route: 'postgres-logs' },
]

const mockAPILogs = {
  error: null,
  result: [
    {
      id: 'uuid-1',
      timestamp: 1713200000000, // 15 Apr 18:53:20"
      event_message: 'Random event message: uuid-1',
      count: 123,
      ok_count: 123,
      error_count: 0,
      warning_count: 20,
      metadata: {
        foo: 'bar',
        request: {
          url: 'https://example.com',
        },
        response: {
          status: 200,
        },
      },
    },
  ],
}

test.beforeEach(async ({ context }) => {
  context.route(/.*logs\.all.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAPILogs),
    })
  })
})

test.describe('Logs', () => {
  for (const logPage of LOGS_PAGES) {
    test(`${logPage.label} logs page`, async ({ page, ref }) => {
      /**
       * Navigates to Logs
       */
      await page.goto(`./project/${ref}/`)
      await page.locator('a', { hasText: 'Logs' }).click({ timeout: 10000 })
      await page.click('body')

      // can take a sec or two for the page to load and redirect to the last logs page
      // wait for 2 secs
      await page.waitForTimeout(2000)

      await expect(page.getByRole('heading', { name: 'Logs & Analytics' }), {
        message: 'Logs & Analytics heading should be visible',
      }).toBeVisible()

      /**
       * Navigates to the specific log page
       */
      await page
        .getByRole('link', { name: logPage.label, exact: true })
        .click()
        .catch((e) => {
          console.log('🔴 Error clicking', logPage, e)
          throw e
        })

      // Wait for logs to be loaded
      await page.waitForResponse((response) => response.url().includes(`logs.all`))

      /**
       * Shows the logs table
       */

      const logsTable = page.getByRole('table')

      await expect(logsTable, {
        message: 'Logs table should be visible',
      }).toBeVisible({ timeout: 20000 })

      /**
       * Shows the logs data without errors
       */
      await expect(page.getByText(mockAPILogs.result[0].event_message), {
        message: 'Logs data should be visible',
      }).toBeVisible()

      /**
       * Can select and view log details
       */
      const gridcells = page.getByText('Random event message')
      await gridcells.click()

      const tabPanel = page.getByTestId('log-selection')
      await expect(tabPanel).toBeVisible()

      // Assert known fixed values instead of extracting text
      await expect(tabPanel, {
        message: 'Log selection should be visible',
      }).toContainText('Random event message: uuid-1')
      await expect(tabPanel.getByTestId('log-selection-timestamp'), {
        message: 'Log selection timestamp should be visible',
      }).toContainText('15 Apr 18:53:20')
    })
  }
})
