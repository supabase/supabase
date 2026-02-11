import { expect, Page } from '@playwright/test'
import { createApiResponseWaiter, waitForTableToLoad } from './wait-for-response.js'

const FILTER_BAR_KEY = 'supabase-ui-table-filter-bar'

/**
 * Enables the filter bar feature flag via localStorage.
 */
export async function enableFilterBar(page: Page) {
  await page.evaluate((key) => {
    localStorage.setItem(key, 'true')
  }, FILTER_BAR_KEY)
}

/**
 * Returns the filter bar freeform input locator.
 */
export function getFilterBarInput(page: Page) {
  return page.getByTestId('filter-bar-freeform-input')
}

/**
 * Clicks "View {tableName}" in the sidebar and waits for the grid to load.
 * The API waiter is created before clicking to avoid a race condition.
 */
export async function navigateToTable(page: Page, ref: string, tableName: string) {
  const gridWaiter = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-rows-')
  await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
  await page.waitForURL(/\/editor\/\d+\?schema=public$/)
  await gridWaiter
}

/**
 * Types a column name into the freeform input, waits for the dropdown item,
 * and presses Enter to create a filter condition.
 */
export async function selectColumnFilter(page: Page, columnName: string) {
  const freeformInput = getFilterBarInput(page)
  await freeformInput.click()
  await freeformInput.fill(columnName)
  await expect(page.getByTestId(`filter-menu-item-${columnName}`)).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId(`filter-operator-${columnName}`)).toBeFocused()
}

/**
 * Waits for the operator dropdown item and presses Enter to select it.
 */
export async function selectOperator(page: Page, columnName: string, operator: string) {
  await expect(page.getByTestId(`filter-menu-item-${operator}`)).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId(`filter-value-${columnName}`)).toBeFocused()
}

/**
 * Creates a complete filter: selects column, operator, enters value, and waits
 * for the grid to refetch. The API waiter is created before filling the value
 * since only a complete filter triggers a grid refetch.
 */
export async function addFilter(
  page: Page,
  ref: string,
  columnName: string,
  operator: string,
  value: string
) {
  await selectColumnFilter(page, columnName)
  await selectOperator(page, columnName, operator)
  const rowsWaiter = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-rows-')
  const valueInput = page.getByTestId(`filter-value-${columnName}`)
  await valueInput.fill(value)
  await page.keyboard.press('Enter')
  await rowsWaiter
}

/**
 * Navigates to the table editor, enables the filter bar, and reloads.
 * The reload waiter must be created before reload to avoid missing the response.
 */
export async function setupFilterBarPage(page: Page, ref: string, editorUrl: string) {
  const loadPromise = waitForTableToLoad(page, ref)
  await page.goto(editorUrl)
  await loadPromise
  await enableFilterBar(page)
  const reloadPromise = waitForTableToLoad(page, ref)
  await page.reload({ waitUntil: 'networkidle' })
  await reloadPromise
}
