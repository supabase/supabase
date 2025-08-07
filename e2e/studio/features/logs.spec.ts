import { expect } from '@playwright/test'
import { test } from '../utils/test'

const LOGS_PAGES = [
  { label: 'API Gateway', route: 'edge-logs' },
  // { label: 'Postgres', route: 'postgres-logs' },
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
      await page.goto(`/project/${ref}/logs/${logPage.route}`)

      await expect(page.getByRole('heading', { name: 'Logs & Analytics' }), {
        message: 'Logs & Analytics heading should be visible',
      }).toBeVisible()

      /**
       * Shows the logs table
       */

      const logsTable = page.getByRole('table')

      await expect(logsTable, {
        message: 'Logs table should be visible',
      }).toBeVisible()

      /**
       * Shows the logs data without errors
       */
      await expect(page.getByText(mockAPILogs.result[0].event_message), {
        message: 'Logs data should be visible',
      }).toBeVisible()

      /**
       * Can select and view log details
       */
      await page.waitForLoadState('networkidle')

      const firstRow = page.getByRole('row', { name: /Random event/ })

      await expect(firstRow, {
        message: 'Logs table should be visible with one row at least',
      }).toBeVisible()

      await firstRow.click({ force: true })

      const tabPanel = page.getByTestId('log-selection')
      await expect(tabPanel, {
        message: 'Log selection panel should be visible',
      }).toBeVisible()

      // Assert known fixed values instead of extracting text
      await expect(tabPanel, {
        message: 'Log selection should be visible',
      }).toContainText('Random event message: uuid-1')
      await expect(tabPanel.getByTestId('log-selection-id'), {
        message: 'Log selection ID should be visible',
      }).toContainText('uuid-1')
    })
  }
})
