import { expect } from '@playwright/test'
import { test } from '../../base'

const LOGS_PAGES = [
  { label: 'API Gateway', route: 'edge-logs' },
  { label: 'Postgres', route: 'postgres-logs' },
  { label: 'PostgREST', route: 'postgrest-logs' },
]

test.describe('Logs', async () => {
  for (const logPage of LOGS_PAGES) {
    test.describe(`${logPage.label} logs page`, () => {
      test('can navigate to logs page', async ({ page, ref }) => {
        await page.goto(`./project/${ref}`)
        await page.locator('a', { hasText: 'Logs' }).click({ timeout: 10000 })
        await expect(page.getByRole('heading', { name: 'Logs & Analytics' })).toBeVisible()

        // Click anywhere on the screen to close the sidebar
        await page.click('body')

        await page
          .getByRole('link', { name: logPage.label, exact: true })
          .click()
          .catch((e) => {
            console.log('🔴 Error clicking', logPage, e)
            throw e
          })

        // Wait for and verify the logs table is present
        const logsTable = page.getByRole('table')
        await expect(logsTable).toBeVisible()
      })

      test('shows logs data without errors', async ({ page, ref, apiUrl }) => {
        // Navigate to page first
        await page.goto(`./project/${ref}/logs/${logPage.route}`)

        await page.waitForResponse((response) =>
          response
            .url()
            .includes(
              `${apiUrl}/platform/projects/${ref}/analytics/endpoints/logs.all?project=${ref}`
            )
        )

        // Wait a bit and check for errors with a longer timeout
        const error = page.getByText('Error fetching logs')
        await expect(error).not.toBeVisible({ timeout: 10000 })

        const emptyState = page.getByText('No results found')
        if (await emptyState.isVisible()) {
          // Empty state, no need to check further
        } else {
          // Check if the logs table has any rows
          const gridcells = page.getByRole('gridcell')
          await expect(gridcells.first()).toBeVisible()
        }
      })

      test('can select and view log details', async ({ page, ref, apiUrl }) => {
        // Navigate to page first
        await page.goto(`./project/${ref}/logs/${logPage.route}`)

        await page.waitForResponse((response) =>
          response
            .url()
            .includes(
              `${apiUrl}/platform/projects/${ref}/analytics/endpoints/logs.all?project=${ref}`
            )
        )

        const emptyState = page.getByText('No results found')
        if (await emptyState.isVisible()) {
          // Empty state, no need to check further
        } else {
          // Check if the logs table has any rows
          const gridcells = page.getByRole('gridcell')

          // Click first row and verify details
          await gridcells.first().click()
          const tabPanel = page.getByTestId('log-selection')
          await page.waitForResponse((response) =>
            response
              .url()
              .includes(
                `${apiUrl}/platform/projects/${ref}/analytics/endpoints/logs.all?project=${ref}`
              )
          )
          await expect(tabPanel).toBeVisible()

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
        }
      })
    })
  }
})
