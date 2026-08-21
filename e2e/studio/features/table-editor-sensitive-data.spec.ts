import crypto from 'node:crypto'
import { expect } from '@playwright/test'

import { createTable, dropTable, query } from '../utils/db/index.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { waitForGridDataToLoad } from '../utils/wait-for-response.js'

const uniqueSuffix = () => crypto.randomBytes(4).toString('hex')

const SENSITIVE_MARKER = '[SENSITIVE]'
const MASKED_VALUE = '••••••••'
const SECRET_VALUE = 'super_secret_value'
const PUBLIC_VALUE = 'public_value'

/**
 * Creates a table with two columns:
 *  - `public_col` (plain text)
 *  - `secret_col` (text, comment contains [SENSITIVE] so it is masked by default)
 * Inserts one row so the grid has data to assert against.
 */
const setupSensitiveFixture = async () => {
  const suffix = uniqueSuffix()
  const tableName = `pw_sensitive_${suffix}`

  await createTable(tableName, 'public_col', [{ public_col: PUBLIC_VALUE }])
  await query(`ALTER TABLE public.${tableName} ADD COLUMN secret_col text`, [])
  await query(`COMMENT ON COLUMN public.${tableName}.secret_col IS '${SENSITIVE_MARKER}'`, [])
  await query(`UPDATE public.${tableName} SET secret_col = $1`, [SECRET_VALUE])

  return {
    tableName,
    async [Symbol.asyncDispose]() {
      await dropTable(tableName)
    },
  }
}

const goToTable = async (
  page: Parameters<typeof waitForGridDataToLoad>[0],
  ref: string,
  tableName: string
) => {
  await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
  await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
  await page.waitForURL(/\/editor\/\d+\?schema=public$/)
  await waitForGridDataToLoad(page, ref)
}

const openColumnMenu = async (
  page: Parameters<typeof waitForGridDataToLoad>[0],
  colName: string
) => {
  await page
    .getByRole('columnheader', { name: colName })
    .getByRole('button', { name: `Column ${colName} actions` })
    .click()
}

test.describe('table editor — sensitive data masking', () => {
  test('sensitive column shows masked value in grid by default', async ({ page, ref }) => {
    await using fixture = await setupSensitiveFixture()
    await goToTable(page, ref, fixture.tableName)

    await expect(
      page.getByRole('gridcell', { name: PUBLIC_VALUE }),
      'public column value should be visible'
    ).toBeVisible()

    await expect(
      page.getByRole('gridcell', { name: MASKED_VALUE }),
      'sensitive column should show masked value'
    ).toBeVisible()

    await expect(
      page.getByRole('gridcell', { name: SECRET_VALUE }),
      'actual sensitive value should not be visible'
    ).not.toBeVisible()
  })

  test('column menu shows "Show data" only for sensitive columns', async ({ page, ref }) => {
    await using fixture = await setupSensitiveFixture()
    await goToTable(page, ref, fixture.tableName)

    await openColumnMenu(page, 'secret_col')
    await expect(
      page.getByRole('menuitem', { name: 'Show data' }),
      '"Show data" should appear in the menu for a sensitive column'
    ).toBeVisible()
    await page.keyboard.press('Escape')

    await openColumnMenu(page, 'public_col')
    await expect(
      page.getByRole('menuitem', { name: 'Show data' }),
      '"Show data" should not appear for a non-sensitive column'
    ).not.toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('"Show data" menu item is disabled while column is temporarily revealed', async ({
    page,
    ref,
  }) => {
    await using fixture = await setupSensitiveFixture()
    await goToTable(page, ref, fixture.tableName)

    // Reveal the sensitive data
    await openColumnMenu(page, 'secret_col')
    await page.getByRole('menuitem', { name: 'Show data' }).click()

    // Wait for the dropdown to fully unmount before reopening it — a trigger
    // click that lands while the previous menu is still closing is dropped
    await page.getByRole('menu').waitFor({ state: 'detached' })

    await openColumnMenu(page, 'secret_col')

    // ColumnMenu.tsx relabels the item to "Data revealed (5s)" while the
    // column is temporarily revealed, so it must be located by that name here
    await expect(
      page.getByRole('menuitem', { name: 'Data revealed (5s)' }),
      '"Show data" menu item should be disabled while column is temporarily revealed'
    ).toBeDisabled({ timeout: 2000 })

    await page.keyboard.press('Escape')
  })

  test('sensitive data is automatically masked again after 5 seconds', async ({ page, ref }) => {
    await using fixture = await setupSensitiveFixture()
    await goToTable(page, ref, fixture.tableName)

    // Reveal the sensitive data
    await openColumnMenu(page, 'secret_col')
    await page.getByRole('menuitem', { name: 'Show data' }).click()

    await expect(
      page.getByRole('gridcell', { name: SECRET_VALUE }),
      'actual value should be visible after reveal'
    ).toBeVisible({ timeout: 5000 })

    // Wait for the temporary reveal to expire
    await page.waitForTimeout(5500)

    await expect(
      page.getByRole('gridcell', { name: MASKED_VALUE }),
      'sensitive value should be masked again after 5 seconds'
    ).toBeVisible()

    await expect(
      page.getByRole('gridcell', { name: SECRET_VALUE }),
      'actual sensitive value should no longer be visible'
    ).not.toBeVisible()
  })

  test('copying a cell from a sensitive column shows a warning toast', async ({ page, ref }) => {
    await using fixture = await setupSensitiveFixture()
    await goToTable(page, ref, fixture.tableName)

    // Reveal first so there is actual text in the cell to right-click
    await openColumnMenu(page, 'secret_col')
    await page.getByRole('menuitem', { name: 'Show data' }).click()
    await expect(page.getByRole('gridcell', { name: SECRET_VALUE })).toBeVisible({ timeout: 5000 })

    const cell = page.getByRole('gridcell', { name: SECRET_VALUE })
    await cell.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Copy cell' }).click()

    await expect(
      page.getByText('Copied sensitive data to clipboard'),
      'warning toast should appear when copying a sensitive cell'
    ).toBeVisible({ timeout: 10000 })
  })

  test('copying a row that contains a sensitive column shows a warning toast', async ({
    page,
    ref,
  }) => {
    await using fixture = await setupSensitiveFixture()
    await goToTable(page, ref, fixture.tableName)

    const cell = page.getByRole('gridcell', { name: PUBLIC_VALUE })
    await cell.click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Copy row' }).click()

    await expect(
      page.getByText('Copied row containing sensitive data to clipboard'),
      'warning toast should appear when copying a row with a sensitive column'
    ).toBeVisible({ timeout: 10000 })
  })
})
