import { expect, Page } from '@playwright/test'

import { createApiResponseWaiter, waitForTableToLoad } from './wait-for-response.js'

const FILTER_BAR_KEY = 'supabase-ui-table-filter-bar'

export async function enableFilterBar(page: Page) {
  await page.evaluate((key) => {
    localStorage.setItem(key, 'true')
  }, FILTER_BAR_KEY)
}

export function getFilterBarInput(page: Page) {
  return page.getByTestId('filter-bar-freeform-input')
}

export async function navigateToTable(page: Page, ref: string, tableName: string) {
  const gridWaiter = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-rows-')
  await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
  await page.waitForURL(/\/editor\/\d+\?schema=public$/)
  await gridWaiter
}

export async function selectColumnFilter(page: Page, columnName: string) {
  const freeformInput = getFilterBarInput(page)
  await freeformInput.click()
  await freeformInput.fill(columnName)
  await expect(page.getByTestId(`filter-menu-item-${columnName}`)).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId(`filter-operator-${columnName}`)).toBeFocused()
}

export async function selectOperator(page: Page, columnName: string, operator: string) {
  await expect(page.getByTestId(`filter-menu-item-${operator}`)).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId(`filter-value-${columnName}`)).toBeFocused()
}

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

export async function selectOperatorByClick(page: Page, columnName: string, operator: string) {
  await expect(page.getByTestId(`filter-menu-item-${operator}`)).toBeVisible()
  await page.getByTestId(`filter-menu-item-${operator}`).click()
  await expect(page.getByTestId(`filter-value-${columnName}`)).toBeFocused()
}

export async function addFilterWithDropdownValue(
  page: Page,
  ref: string,
  columnName: string,
  operator: string,
  optionValue: string
) {
  await selectColumnFilter(page, columnName)
  await selectOperatorByClick(page, columnName, operator)
  const rowsWaiter = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-rows-')
  await expect(page.getByTestId(`filter-menu-item-${optionValue}`)).toBeVisible()
  await page.getByTestId(`filter-menu-item-${optionValue}`).click()
  await rowsWaiter
}

export async function setupFilterBarPage(page: Page, ref: string, editorUrl: string) {
  const loadPromise = waitForTableToLoad(page, ref)
  await page.goto(editorUrl)
  await loadPromise
  await enableFilterBar(page)
  const reloadPromise = waitForTableToLoad(page, ref)
  await page.reload({ waitUntil: 'networkidle' })
  await reloadPromise
}
