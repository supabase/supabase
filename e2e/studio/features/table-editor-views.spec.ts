import { expect, Page } from '@playwright/test'

import { env } from '../env.config.js'
import { expectClipboardValue } from '../utils/clipboard.js'
import {
  createMaterializedView,
  createTable,
  createView,
  dropMaterializedView,
  dropTable,
  dropView,
} from '../utils/db/queries.js'
import { test, withSetupCleanup } from '../utils/test.js'
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

// Run on platform serially to avoid rate limits; parallel in self-hosted.
const testRunner = env.IS_PLATFORM ? test.describe.serial : test.describe

testRunner('table editor — view context menu', () => {
  const baseTable = 'pw_view_menu_base'
  const viewName = 'pw_view_menu_view'

  const setupView = async () => {
    await createTable(baseTable, 'note', [{ note: 'alpha' }, { note: 'beta' }])
    await createView(viewName, `SELECT id, note FROM public.${baseTable}`)
  }

  const cleanupView = async () => {
    await dropView(viewName)
    await dropTable(baseTable)
  }

  test('copy name copies the view name to clipboard', async ({ page, ref }) => {
    await using _ = await withSetupCleanup(setupView, cleanupView)
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, viewName)
    await page.getByRole('menuitem', { name: 'Copy name' }).click()
    await expect(
      page.getByRole('menuitem', { name: 'Copy name' }),
      'menu should close after Copy name click'
    ).not.toBeVisible()

    await expectClipboardValue({ page, value: viewName, exact: true })
  })

  test('copy view definition copies CREATE VIEW statement to clipboard', async ({ page, ref }) => {
    await using _ = await withSetupCleanup(setupView, cleanupView)
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, viewName)

    const definitionWait = waitForApiResponse(page, 'pg-meta', ref, 'query?key=view-definition-')
    await page.getByRole('menuitem', { name: 'Copy view definition' }).click()
    await definitionWait

    await expect(
      page.getByText('View definition copied to clipboard'),
      'success toast should appear after copy'
    ).toBeVisible({ timeout: 15000 })

    const clipboardText: string = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText.toLowerCase()).toContain(`create view`)
    expect(clipboardText.toLowerCase()).toContain(viewName.toLowerCase())
  })

  test('export view as CSV shows confirmation reason and downloads', async ({ page, ref }) => {
    await using _ = await withSetupCleanup(setupView, cleanupView)
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, viewName)
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
    await using _ = await withSetupCleanup(setupView, cleanupView)
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, viewName)
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
    // No outer cleanup — the test deletes the view. Just clean the base table at the end.
    await using _ = await withSetupCleanup(
      async () => {
        await createTable(baseTable, 'note', [{ note: 'alpha' }])
        await createView(viewName, `SELECT id, note FROM public.${baseTable}`)
      },
      async () => {
        await dropView(viewName)
        await dropTable(baseTable)
      }
    )
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, viewName)
    await page.getByRole('menuitem', { name: 'Delete view' }).click()

    await expect(
      page.getByRole('heading', { name: `Confirm deletion of view "${viewName}"` }),
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
          await page.getByRole('button', { name: `View ${viewName}`, exact: true }).count(),
        { message: 'view should be removed from the sidebar after delete' }
      )
      .toBe(0)
  })
})

testRunner('table editor — materialized view context menu', () => {
  const baseTable = 'pw_mv_menu_base'
  const mvName = 'pw_mv_menu_view'

  const setupMv = async () => {
    await createTable(baseTable, 'note', [{ note: 'alpha' }, { note: 'beta' }])
    await createMaterializedView(mvName, `SELECT id, note FROM public.${baseTable}`)
  }

  const cleanupMv = async () => {
    await dropMaterializedView(mvName)
    await dropTable(baseTable)
  }

  test('copy name copies the materialized view name to clipboard', async ({ page, ref }) => {
    await using _ = await withSetupCleanup(setupMv, cleanupMv)
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, mvName)
    await page.getByRole('menuitem', { name: 'Copy name' }).click()
    await expect(page.getByRole('menuitem', { name: 'Copy name' })).not.toBeVisible()

    await expectClipboardValue({ page, value: mvName, exact: true })
  })

  test('copy materialized view definition copies CREATE statement to clipboard', async ({
    page,
    ref,
  }) => {
    await using _ = await withSetupCleanup(setupMv, cleanupMv)
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, mvName)

    const definitionWait = waitForApiResponse(page, 'pg-meta', ref, 'query?key=view-definition-')
    await page.getByRole('menuitem', { name: 'Copy materialized view definition' }).click()
    await definitionWait

    await expect(page.getByText('Materialized view definition copied to clipboard')).toBeVisible({
      timeout: 15000,
    })

    const clipboardText: string = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText.toLowerCase()).toContain('create materialized view')
    expect(clipboardText.toLowerCase()).toContain(mvName.toLowerCase())
  })

  test('export materialized view as CSV shows confirmation and downloads', async ({
    page,
    ref,
  }) => {
    await using _ = await withSetupCleanup(setupMv, cleanupMv)
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, mvName)
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
    await using _ = await withSetupCleanup(setupMv, cleanupMv)
    await goToTableEditor(page, ref)

    await openEntityContextMenu(page, mvName)
    await page.getByRole('menuitem', { name: 'Delete materialized view' }).click()

    await expect(
      page.getByRole('heading', {
        name: `Confirm deletion of materialized view "${mvName}"`,
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
        async () => await page.getByRole('button', { name: `View ${mvName}`, exact: true }).count()
      )
      .toBe(0)
  })
})
