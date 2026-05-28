import crypto from 'node:crypto'
import { expect, Page } from '@playwright/test'

import { expectClipboardValue } from '../utils/clipboard.js'
import {
  createMaterializedView,
  createTable,
  createView,
  dropMaterializedView,
  dropTable,
  dropView,
} from '../utils/db/queries.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { createApiResponseWaiter, waitForApiResponse } from '../utils/wait-for-response.js'

/**
 * Opens the entity context menu in the table editor sidebar.
 * The entity must be the currently-selected one (canEdit = isActive && !isLocked).
 */
const openEntityContextMenu = async (page: Page, entityName: string) => {
  const entityButton = page.getByRole('button', { name: `View ${entityName}`, exact: true })
  await entityButton.click()
  await entityButton.hover()
  const menuButton = entityButton.locator('button[aria-haspopup="menu"]')
  await expect(menuButton).toBeVisible({ timeout: 30000 })
  await menuButton.click()
}

const goToTableEditor = async (page: Page, ref: string) => {
  const tableLoadWait = createApiResponseWaiter(
    page,
    'pg-meta',
    ref,
    'query?key=entity-types-public-'
  )
  await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
  await tableLoadWait
}

const uniqueSuffix = () => crypto.randomBytes(4).toString('hex')

/**
 * Each test owns its own base table + view so tests can run in parallel without
 * stomping on each other's DB state. Use with `await using fixture = ...` so
 * cleanup runs whether the test passes or fails.
 */
const setupViewFixture = async (
  rows: Array<Record<string, string>> = [{ note: 'alpha' }, { note: 'beta' }]
) => {
  const suffix = uniqueSuffix()
  const baseTable = `pw_view_menu_base_${suffix}`
  const viewName = `pw_view_menu_view_${suffix}`
  await createTable(baseTable, 'note', rows)
  await createView(viewName, `SELECT id, note FROM public.${baseTable}`)
  return {
    baseTable,
    viewName,
    async [Symbol.asyncDispose]() {
      await dropView(viewName)
      await dropTable(baseTable)
    },
  }
}

const setupMaterializedViewFixture = async (
  rows: Array<Record<string, string>> = [{ note: 'alpha' }, { note: 'beta' }]
) => {
  const suffix = uniqueSuffix()
  const baseTable = `pw_mv_menu_base_${suffix}`
  const mvName = `pw_mv_menu_view_${suffix}`
  await createTable(baseTable, 'note', rows)
  await createMaterializedView(mvName, `SELECT id, note FROM public.${baseTable}`)
  return {
    baseTable,
    mvName,
    async [Symbol.asyncDispose]() {
      await dropMaterializedView(mvName)
      await dropTable(baseTable)
    },
  }
}

test.describe('table editor — view context menu', () => {
  test('copy name copies the view name to clipboard', async ({ page, ref }) => {
    await using fixture = await setupViewFixture()
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, fixture.viewName)
    await page.getByRole('menuitem', { name: 'Copy name' }).click()
    await expect(
      page.getByRole('menuitem', { name: 'Copy name' }),
      'menu should close after Copy name click'
    ).not.toBeVisible()

    await expectClipboardValue({ page, value: fixture.viewName, exact: true })
  })

  test('copy view definition copies CREATE VIEW statement to clipboard', async ({ page, ref }) => {
    await using fixture = await setupViewFixture()
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, fixture.viewName)

    const definitionWait = waitForApiResponse(page, 'pg-meta', ref, 'query?key=view-definition-')
    await page.getByRole('menuitem', { name: 'Copy definition' }).click()
    await definitionWait

    await expect(
      page.getByText('View definition copied to clipboard'),
      'success toast should appear after copy'
    ).toBeVisible({ timeout: 15000 })

    const clipboardText: string = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText.toLowerCase()).toContain(`create view`)
    expect(clipboardText.toLowerCase()).toContain(fixture.viewName.toLowerCase())
  })

  test('export view as CSV shows confirmation reason and downloads', async ({ page, ref }) => {
    await using fixture = await setupViewFixture()
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, fixture.viewName)
    const exportItem = page.getByRole('menuitem', { name: 'Export data' })
    await expect(exportItem).toBeVisible()
    await exportItem.hover()
    await expect(exportItem).toHaveAttribute('data-state', /open/)
    await page.getByRole('menuitem', { name: 'Export view as CSV' }).click()

    // Confirmation modal appears with reason text — guards the shared-component fix.
    await expect(
      page.getByText('Confirm to export data'),
      'export confirmation dialog should appear'
    ).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByText(/Exporting a view may cause consistency issues/i),
      'confirmation reason text should be visible inside the modal'
    ).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Submit' }).click(),
    ])
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('export view as SQL shows confirmation and downloads', async ({ page, ref }) => {
    await using fixture = await setupViewFixture()
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, fixture.viewName)
    const exportItem = page.getByRole('menuitem', { name: 'Export data' })
    await expect(exportItem).toBeVisible()
    await exportItem.hover()
    await expect(exportItem).toHaveAttribute('data-state', /open/)
    await page.getByRole('menuitem', { name: 'Export view as SQL' }).click()

    await expect(
      page.getByText('Confirm to export data'),
      'export confirmation dialog should appear'
    ).toBeVisible({ timeout: 15000 })

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Submit' }).click(),
    ])
    expect(download.suggestedFilename()).toContain('.sql')
  })

  test('delete view runs DROP VIEW and removes it from the sidebar', async ({ page, ref }) => {
    await using fixture = await setupViewFixture([{ note: 'alpha' }])
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, fixture.viewName)
    await page.getByRole('menuitem', { name: 'Delete view' }).click()

    await expect(
      page.getByRole('heading', { name: `Confirm deletion of view "${fixture.viewName}"` }),
      'confirm dialog title should include the view name'
    ).toBeVisible({ timeout: 15000 })

    const deletePromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=view-delete-', {
      method: 'POST',
    })
    const entityTypesPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=entity-types-')
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await Promise.all([deletePromise, entityTypesPromise])

    await expect
      .poll(
        async () =>
          await page.getByRole('button', { name: `View ${fixture.viewName}`, exact: true }).count(),
        { message: 'view should be removed from the sidebar after delete' }
      )
      .toBe(0)
  })
})

test.describe('table editor — materialized view context menu', () => {
  test('copy name copies the materialized view name to clipboard', async ({ page, ref }) => {
    await using fixture = await setupMaterializedViewFixture()
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, fixture.mvName)
    await page.getByRole('menuitem', { name: 'Copy name' }).click()
    await expect(page.getByRole('menuitem', { name: 'Copy name' })).not.toBeVisible()

    await expectClipboardValue({ page, value: fixture.mvName, exact: true })
  })

  test('copy materialized view definition copies CREATE statement to clipboard', async ({
    page,
    ref,
  }) => {
    await using fixture = await setupMaterializedViewFixture()
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, fixture.mvName)

    const definitionWait = waitForApiResponse(page, 'pg-meta', ref, 'query?key=view-definition-')
    await page.getByRole('menuitem', { name: 'Copy definition' }).click()
    await definitionWait

    await expect(page.getByText('Materialized view definition copied to clipboard')).toBeVisible({
      timeout: 15000,
    })

    const clipboardText: string = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText.toLowerCase()).toContain('create materialized view')
    expect(clipboardText.toLowerCase()).toContain(fixture.mvName.toLowerCase())
  })

  test('export materialized view as CSV shows confirmation and downloads', async ({
    page,
    ref,
  }) => {
    await using fixture = await setupMaterializedViewFixture()
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, fixture.mvName)
    const exportItem = page.getByRole('menuitem', { name: 'Export data' })
    await expect(exportItem).toBeVisible()
    await exportItem.hover()
    await expect(exportItem).toHaveAttribute('data-state', /open/)
    await page.getByRole('menuitem', { name: 'Export view as CSV' }).click()

    await expect(
      page.getByText(/Exporting a materialized view may cause performance issues/i),
      'materialized view-specific confirmation reason should appear'
    ).toBeVisible({ timeout: 15000 })

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Submit' }).click(),
    ])
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('delete materialized view runs DROP and removes it from the sidebar', async ({
    page,
    ref,
  }) => {
    await using fixture = await setupMaterializedViewFixture()
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, fixture.mvName)
    await page.getByRole('menuitem', { name: 'Delete view' }).click()

    await expect(
      page.getByRole('heading', {
        name: `Confirm deletion of materialized view "${fixture.mvName}"`,
      })
    ).toBeVisible({ timeout: 15000 })

    const deletePromise = waitForApiResponse(
      page,
      'pg-meta',
      ref,
      'query?key=materialized-view-delete-',
      { method: 'POST' }
    )
    const entityTypesPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=entity-types-')
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await Promise.all([deletePromise, entityTypesPromise])

    await expect
      .poll(
        async () =>
          await page.getByRole('button', { name: `View ${fixture.mvName}`, exact: true }).count()
      )
      .toBe(0)
  })
})
