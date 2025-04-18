import { expect } from '@playwright/test'
import { test } from '../utils/test'

const LOGS_PAGES = [
  { label: 'API Gateway', route: 'edge-logs' },
  { label: 'Postgres', route: 'postgres-logs' },
  { label: 'PostgREST', route: 'postgrest-logs' },
]

const mockAPILogs = {
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
        request: {},
        response: {},
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

test.describe('Logs', async () => {
  for (const logPage of LOGS_PAGES) {
    test.describe(`${logPage.label} logs page`, () => {
      test('can navigate to logs page', async ({ page, ref }) => {
        await page.goto(`./project/${ref}`)
        await page.locator('a', { hasText: 'Logs' }).click({ timeout: 10000 })

        await page.click('body')

        await expect(page.getByRole('heading', { name: 'Logs & Analytics' })).toBeVisible({
          timeout: 50000,
        })

        await page
          .getByRole('link', { name: logPage.label, exact: true })
          .click()
          .catch((e) => {
            console.log('🔴 Error clicking', logPage, e)
            throw e
          })

        const logsTable = page.getByRole('table')
        await expect(logsTable).toBeVisible()
      })

      test('shows logs data without errors', async ({ page, ref, apiUrl }) => {
        await page.goto(`./project/${ref}/logs/${logPage.route}`)

        const logsTable = page.getByRole('table')
        await expect(logsTable).toBeVisible()

        await expect(page.getByText(mockAPILogs.result[0].event_message)).toBeVisible()
      })

      test('can select and view log details', async ({ page, ref }) => {
        await page.goto(`./project/${ref}/logs/${logPage.route}`)

        await page.waitForResponse((response) => response.url().includes(`logs.all`))

        const logsTable = page.getByRole('table')
        await expect(logsTable).toBeVisible()

        const gridcells = page.getByRole('gridcell')
        await gridcells.first().click()

        const tabPanel = page.getByTestId('log-selection')
        await expect(tabPanel).toBeVisible()

        // Assert known fixed values instead of extracting text
        await expect(tabPanel).toContainText('Random event message: uuid-1')
        await expect(tabPanel.getByTestId('log-selection-timestamp')).toContainText(
          '15 Apr 18:53:20'
        )
      })
    })
  }
})
