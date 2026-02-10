import fs from 'fs'
import path from 'path'
import { expect, Page } from '@playwright/test'

import { env } from '../env.config.js'
import { createTable as dbCreateTable, dropTable } from '../utils/db/index.js'
import { releaseFileOnceCleanup, withFileOnceSetup } from '../utils/once-per-file.js'
import { resetLocalStorage } from '../utils/reset-local-storage.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { waitForApiResponseWithTimeout } from '../utils/wait-for-response-with-timeout.js'
import {
  createApiResponseWaiter,
  waitForApiResponse,
  waitForGridDataToLoad,
  waitForTableToLoad,
} from '../utils/wait-for-response.js'

const tableNamePrefix = 'pw_table'
const columnName = 'pw_column'

const dismissToastsIfAny = async (page: Page) => {
  const closeButtons = page.getByRole('button', { name: 'Close toast' })
  const count = await closeButtons.count()
  for (let i = 0; i < count; i++) {
    await closeButtons.nth(i).click()
  }
}

const createTable = async (page: Page, ref: string, tableName: string) => {
  // Ensure no toast overlays block the dialog trigger
  await dismissToastsIfAny(page)

  const newTableBtn = page.getByRole('button', { name: 'New table', exact: true })
  await expect(newTableBtn).toBeVisible()
  await newTableBtn.click()

  // Check if we're in the unable to find table error
  // If so, click Close tab or Head back first
  const closeTabBtn = page.getByRole('button', { name: 'Close tab' })
  const headBackBtn = page.getByRole('button', { name: 'Head back' })
  if ((await closeTabBtn.count()) > 0) {
    await closeTabBtn.click()
  }
  if ((await headBackBtn.count()) > 0) {
    await headBackBtn.click()
  }

  const nameInput = page.getByTestId('table-name-input')
  await expect(nameInput).toBeVisible()
  await nameInput.fill(tableName)
  await expect(nameInput).toHaveValue(tableName)
  await page.getByTestId('created_at-extra-options').click()
  await page.getByRole('checkbox', { name: 'Is Nullable' }).click()
  await page.getByTestId('created_at-extra-options').click({ force: true })
  await page.getByRole('button', { name: 'Add column' }).click()
  await page.getByRole('textbox', { name: 'column_name' }).fill(columnName)
  await page.getByText('Choose a column type...').click()
  await page.getByRole('option', { name: 'text Variable-length' }).click()
  const createTablePromise = waitForApiResponseWithTimeout(page, (response) =>
    response.url().includes('query?key=table-create')
  )
  // Wait specifically for tables list refresh instead of generic networkidle
  const tablesPromise = waitForApiResponseWithTimeout(page, (response) =>
    response.url().includes('tables?include_columns=true&included_schemas=public')
  )
  // wait for tables to load, we don't need to wait here cause this response may complete before the table creation.
  const entitiesPromise = waitForApiResponseWithTimeout(page, (response) =>
    response.url().includes('query?key=entity-types-public-')
  )
  await page.getByRole('button', { name: 'Save' }).click()
  await Promise.all([createTablePromise, tablesPromise, entitiesPromise])
  await page.waitForSelector('[data-testid="table-editor-side-panel"]', { state: 'detached' })
  await expect(
    page.getByRole('button', { name: `View ${tableName}`, exact: true }),
    'Table should be visible after creation'
  ).toBeVisible()
}

const deleteTable = async (page: Page, ref: string, tableName: string) => {
  const viewLocator = page.getByLabel(`View ${tableName}`)
  if ((await viewLocator.count()) === 0) return
  await viewLocator.nth(0).click()
  await viewLocator.locator('button[aria-haspopup="menu"]').click({ force: true })
  await page.getByText('Delete table').click()
  await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).click()
  const apiPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-delete-', {
    method: 'POST',
  })
  const revalidatePromise = waitForApiResponse(page, 'pg-meta', ref, `query?key=entity-types-`)
  await page.getByRole('button', { name: 'Delete' }).click()
  await Promise.all([apiPromise, revalidatePromise])
  await expect(page.getByTestId('confirm-delete-table-modal')).not.toBeVisible()
}

const deleteEnumIfExist = async (page: Page, ref: string, enumName: string) => {
  await waitForApiResponse(page, 'pg-meta', ref, 'types')

  // if enum (test) exists, delete it.
  const exists = (await page.getByRole('cell', { name: enumName, exact: true }).count()) > 0
  if (!exists) return

  await page
    .getByRole('row', { name: `public ${enumName}` })
    .getByRole('button')
    .click()
  await page.getByRole('menuitem', { name: 'Delete type' }).click()
  await page.getByRole('heading', { name: 'Confirm to delete enumerated' }).click()
  await page.getByRole('button', { name: 'Confirm delete' }).click()
  await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' })
}

// Due to rate API rate limits run this test in serial mode on platform.
const testRunner = env.IS_PLATFORM ? test.describe.serial : test.describe
testRunner('table editor', () => {
  test.beforeAll(async ({ browser, ref }) => {
    await withFileOnceSetup(import.meta.url, async () => {
      const ctx = await browser.newContext()
      const page = await ctx.newPage()

      const loadPromise = waitForTableToLoad(page, ref)
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await loadPromise

      const viewButtons = page.getByRole('button', { name: /^View / })
      const names = await Promise.all(
        (await viewButtons.all()).map(async (btn) => {
          const ariaLabel = await btn.getAttribute('aria-label')
          const name = ariaLabel ? ariaLabel.replace(/^View\s+/, '').trim() : ''
          return name
        })
      )
      const tablesToDelete = names.filter((tableName) => tableName.startsWith(tableNamePrefix))

      for (const tableName of tablesToDelete) {
        await deleteTable(page, ref, tableName)
        await expect
          .poll(async () => {
            return await page.getByLabel(`View ${tableName}`, { exact: true }).count()
          })
          .toBe(0)
      }
    })
  })

  test.beforeEach(async ({ page, ref }) => {
    const loadPromise = waitForTableToLoad(page, ref)
    page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await loadPromise
  })

  test.afterAll(async () => {
    await releaseFileOnceCleanup(import.meta.url)
  })

  test('sidebar actions works as expected', async ({ page, ref }) => {
    const tableNameActions = 'pw_table_actions'
    const tableNameActionsDuplicate = 'pw_table_actions_duplicate'

    // create table + verify that this exists.
    await createTable(page, ref, tableNameActions)

    // copies table name to clipboard when copy table name is clicked
    await page.getByRole('button', { name: `View ${tableNameActions}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)
    await page
      .getByRole('button', { name: `View ${tableNameActions}`, exact: true })
      .getByRole('button')
      .nth(2)
      .click()
    await page.getByRole('menuitem', { name: 'Copy name' }).click()
    await page.waitForTimeout(500)
    const copiedTableResult = await page.evaluate(() => navigator.clipboard.readText())
    expect(copiedTableResult).toBe('pw_table_actions')

    // copies table schema to clipboard when copy schema option is clicked
    await page
      .getByRole('button', { name: `View ${tableNameActions}`, exact: true })
      .getByRole('button')
      .nth(2)
      .click()
    await page.getByRole('menuitem', { name: 'Copy table schema' }).click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-definition-') // wait for endpoint to generate schema
    await page.waitForTimeout(500)
    const copiedSchemaResult = await page.evaluate(() => navigator.clipboard.readText())
    expect(copiedSchemaResult).toBe(`create table public.pw_table_actions (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone null default now(),
  pw_column text null,
  constraint pw_table_actions_pkey primary key (id)
) TABLESPACE pg_default;`)

    // duplicates table
    await page
      .getByRole('button', { name: `View ${tableNameActions}`, exact: true })
      .getByRole('button')
      .nth(2)
      .click()
    await page.getByRole('menuitem', { name: 'Duplicate table' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' }) // create duplicate table
    await waitForTableToLoad(page, ref) // load tables
    await expect(
      page.getByLabel(`View ${tableNameActionsDuplicate}`, { exact: true })
    ).toBeVisible()
  })

  test('switching schemas work as expected', async ({ page, ref }) => {
    const authTableSso = 'identities'
    const authTableMfa = 'mfa_factors'

    // change schema from public to auth
    await page.getByTestId('schema-selector').click()
    await page.getByPlaceholder('Find schema...').fill('auth')

    // Set up the waiter BEFORE clicking to avoid race condition
    const tableLoadPromise = waitForTableToLoad(page, ref, 'auth')
    await page.getByRole('option', { name: 'auth' }).click()
    await tableLoadPromise // wait for auth tables to load

    await expect(page.getByLabel(`View ${authTableSso}`)).toBeVisible()
    await expect(page.getByLabel(`View ${authTableMfa}`)).toBeVisible()

    // Search is client-side filtering - no API call needed
    await page.getByRole('textbox', { name: 'Search tables...' }).fill('mfa')

    // Wait for the UI to update after search (allow debounce to complete)
    await page.waitForTimeout(300)

    await expect(page.getByLabel(`View ${authTableSso}`)).not.toBeVisible()
    await expect(page.getByLabel(`View ${authTableMfa}`)).toBeVisible()
  })

  test('should show rls accordingly', async ({ page, ref }) => {
    const tableNameRlsEnabled = 'pw_table_rls_enabled'
    const tableNameRlsDisabled = 'pw_table_rls_disabled'

    // create table with RLS enabled and verify
    await createTable(page, ref, tableNameRlsEnabled)
    await page.getByRole('button', { name: `View ${tableNameRlsEnabled}` }).click()
    await expect(page.getByRole('link', { name: 'Add RLS policy' })).toBeVisible()

    // create table with RLS disabled and verify
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await page.getByTestId('table-name-input').fill(tableNameRlsDisabled)
    await page.getByLabel('Enable Row Level Security (').click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    // Wait for table creation
    const apiPromise = waitForApiResponse(
      page,
      'pg-meta',
      ref,
      'tables?include_columns=false&included_schemas=public'
    )
    // Wait for lints refresh
    const lintsPromise = waitForApiResponse(page, 'projects', ref, 'run-lints')

    await page.getByRole('button', { name: 'Save' }).click()
    await apiPromise
    await lintsPromise
    await page.getByRole('button', { name: `View ${tableNameRlsDisabled}` }).click()
    await expect(page.getByRole('button', { name: 'RLS disabled' })).toBeVisible()
  })

  test('add enums and show enums on table', async ({ page, ref }) => {
    const tableNameEnum = 'pw_table_enum'
    const columnNameEnum = 'pw_column_enum'
    const enum_name = 'pw_enum'

    await page.goto(toUrl(`/project/${ref}/database/types?schema=public`))

    // delete enum if it exists
    await deleteEnumIfExist(page, ref, enum_name)

    // create a new enum
    await page.getByRole('button', { name: 'Create type' }).click()
    await page.getByRole('textbox', { name: 'Name' }).fill(enum_name)
    await page.locator('input[name="values.0.value"]').fill('value1')
    await page.getByRole('button', { name: 'Add value' }).click()
    await page.locator('input[name="values.1.value"]').fill('value2')
    await page.getByRole('button', { name: 'Create type' }).click()
    await waitForApiResponse(page, 'pg-meta', ref, 'types')

    // verify enum is created
    await expect(page.getByRole('cell', { name: enum_name, exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'value1, value2', exact: true })).toBeVisible()

    // create a new table with new column for enums
    await page.goto(toUrl(`/project/${ref}/editor`))

    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await page.getByTestId('table-name-input').fill(tableNameEnum)
    await page.getByTestId('created_at-extra-options').click()
    await page.getByText('Is Nullable').click()
    await page.getByTestId('created_at-extra-options').click()
    await page.getByRole('button', { name: 'Add column' }).click()
    await page.getByRole('textbox', { name: 'column_name' }).fill(columnNameEnum)
    await page.getByRole('combobox').filter({ hasText: 'Choose a column type...' }).click()
    await page.getByPlaceholder('Search types...').fill(enum_name)
    // wait for response, then click
    await page.getByRole('option', { name: enum_name }).click()
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(
      page.getByText(`Table ${tableNameEnum} is good to go!`),
      'Success toast should be visible after table creation'
    ).toBeVisible({
      timeout: 50000,
    })
    await expect(page.getByTestId('table-editor-side-panel')).not.toBeVisible()

    // Wait for the grid to be visible and data to be loaded
    await expect(page.getByRole('grid'), 'Grid should be visible after inserting data').toBeVisible(
      { timeout: 10_000 }
    )
    await expect(page.getByRole('columnheader', { name: enum_name })).toBeVisible()

    // insert row with enum value
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByText('Insert a new row into').click()
    await page.getByRole('combobox').selectOption('value1')
    await page.getByTestId('action-bar-save-row').click()
    await expect(page.getByTestId('side-panel-row-editor')).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'value1' })).toBeVisible()

    // insert row with another enum value
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByText('Insert a new row into').click()
    await page.getByRole('combobox').selectOption('value2')
    await page.getByTestId('action-bar-save-row').click()
    await expect(page.getByRole('gridcell', { name: 'value2' })).toBeVisible({ timeout: 10_000 })

    // delete enum and enum table
    await deleteTable(page, ref, tableNameEnum)
    await page.goto(toUrl(`/project/${ref}/database/types?schema=public`))
    await deleteEnumIfExist(page, ref, enum_name)

    // clear local storage, as it might result in some flakiness
    await resetLocalStorage(page, ref)
  })

  test('Grid editor exporting works as expected', async ({ page, ref }) => {
    const tableNameGridEditor = ' pw_table_grid_editor'
    const tableNameUpdated = 'pw_table_updated'
    const columnNameUpdated = 'pw_column_updated'

    // create a new table
    await createTable(page, ref, tableNameGridEditor)
    await page.getByRole('button', { name: `View ${tableNameGridEditor}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    // create 3 rows
    for (const value of ['789', '456', '123']) {
      await page.getByTestId('table-editor-insert-new-row').click()
      await page.getByRole('menuitem', { name: 'Insert row Insert a new row' }).click()
      await page.getByTestId('pw_column-input').fill(value)
      await page.getByTestId('action-bar-save-row').click()
      await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' }) // insert rows
    }

    // verify row content
    expect(await page.getByRole('gridcell').nth(3).textContent()).toBe('789')
    expect(await page.getByRole('gridcell').nth(8).textContent()).toBe('456')
    expect(await page.getByRole('gridcell').nth(13).textContent()).toBe('123')

    // edit table (rename table, rename column name)
    await page
      .getByRole('button', { name: `View ${tableNameGridEditor}`, exact: true })
      .getByRole('button')
      .nth(2)
      .click()
    await page.getByRole('menuitem', { name: 'Edit table' }).click()
    await page.getByTestId('table-name-input').fill(tableNameUpdated)
    await page.getByRole('textbox', { name: 'pw_column' }).fill(columnNameUpdated)
    await page.getByRole('button', { name: 'Save' }).click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=column-update', { method: 'POST' }) // update table
    await waitForTableToLoad(page, ref) // load tables
    await expect(page.getByLabel(`View ${tableNameUpdated}`, { exact: true })).toBeVisible()
    await expect(page.getByLabel(`View ${tableNameGridEditor}`, { exact: true })).not.toBeVisible()
    await expect(page.getByRole('columnheader', { name: columnNameUpdated })).toBeVisible()
    await expect(
      page.getByRole('columnheader', { name: columnName, exact: true })
    ).not.toBeVisible()

    // test export data via csv
    await page
      .getByRole('button', { name: `View ${tableNameUpdated}`, exact: true })
      .getByRole('button')
      .nth(2)
      .click()
    // Open nested export submenu via keyboard (more stable than hover in headless)
    const exportDataItemCsv = page.getByRole('menuitem', { name: 'Export data' })
    await expect(exportDataItemCsv).toBeVisible()
    await exportDataItemCsv.hover()
    await expect(exportDataItemCsv).toHaveAttribute('data-state', /open/)
    await expect(page.getByRole('menuitem', { name: 'Export table as CSV' })).toBeVisible()
    const [downloadCsv] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('menuitem', { name: 'Export table as CSV' }).click(),
    ])
    expect(downloadCsv.suggestedFilename()).toContain('.csv')
    const downloadCsvPath = await downloadCsv.path()

    const csvContent = fs.readFileSync(downloadCsvPath, 'utf-8').replace(/\r?\n/g, '\n')
    const rows = csvContent.trim().split('\n')
    const columnData = rows.map((row) => {
      const columns = row.split(',')
      return columns[2].trim()
    })
    const expectedColumnData = `${columnNameUpdated}, 123, 456, 789`
    columnData.forEach((expectedValue) => {
      expect(expectedColumnData).toContain(expectedValue)
    })
    fs.unlinkSync(downloadCsvPath)

    // Close submenu and parent menu to avoid UI leftovers
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // expect to NOT find the Export data menu item
    await expect(page.getByRole('menuitem', { name: 'Export data' })).not.toBeVisible()

    // test export data via SQL + verify
    await page
      .getByRole('button', { name: `View ${tableNameUpdated}`, exact: true })
      .getByRole('button')
      .nth(2)
      .click()
    // Open nested export submenu via keyboard (more stable than hover in headless)
    const exportDataItemSql = page.getByRole('menuitem', { name: 'Export data' })
    await expect(exportDataItemSql).toBeVisible()
    await exportDataItemSql.hover({
      force: true,
    })
    await expect(exportDataItemSql).toHaveAttribute('data-state', /open/)
    await expect(page.getByRole('menuitem', { name: 'Export table as SQL' })).toBeVisible()
    const [downloadSql] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('menuitem', { name: 'Export table as SQL' }).click(),
    ])
    expect(downloadSql.suggestedFilename()).toContain('.sql')
    const downloadSqlPath = await downloadSql.path()
    const sqlContent = fs.readFileSync(downloadSqlPath, 'utf-8')
    expect(sqlContent).toContain(
      `INSERT INTO "public"."${tableNameUpdated}" ("id", "created_at", "${columnNameUpdated}") VALUES`
    )
    expect(sqlContent).toContain('789')
    expect(sqlContent).toContain('456')
    expect(sqlContent).toContain('123')
    fs.unlinkSync(downloadSqlPath)

    // Close submenu and parent menu to avoid UI leftovers
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // test export data via CLI
    await page
      .getByRole('button', { name: `View ${tableNameUpdated}`, exact: true })
      .getByRole('button')
      .nth(2)
      .click()

    const exportDataItemCli = page.getByRole('menuitem', { name: 'Export data' })
    await expect(exportDataItemCli).toBeVisible()
    await exportDataItemCli.hover({
      force: true,
    })
    await expect(page.getByRole('menuitem', { name: 'Export table via CLI' })).toBeVisible()
    await page.getByRole('menuitem', { name: 'Export table via CLI' }).click()
    await expect(page.getByRole('heading', { name: 'Export table data via CLI' })).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).first().click()
  })

  test('filtering rows works as expected', async ({ page, ref }) => {
    const tableName = 'pw_table_filtering'
    const colName = 'pw_column'

    if (!page.url().includes('/editor')) {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await waitForTableToLoad(page, ref)
    }

    await createTable(page, ref, tableName)
    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    for (const value of ['789', '456', '123']) {
      await page.getByTestId('table-editor-insert-new-row').click()
      await page.getByRole('menuitem', { name: 'Insert row Insert a new row' }).click()
      await page.getByTestId(`${colName}-input`).fill(value)
      const apiPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' })
      await page.getByTestId('action-bar-save-row').click()
      await apiPromise
    }

    await page.getByRole('button', { name: 'Filter', exact: true }).click()
    await page.getByRole('button', { name: 'Add filter' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'id', exact: true }).click()
    await page.getByRole('menuitem', { name: colName }).click()
    await page.getByRole('textbox', { name: 'Enter a value' }).fill('789')
    const waitForFilterApply = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=table-rows-'
    )
    await page.getByRole('button', { name: 'Apply filter' }).click()
    await waitForFilterApply
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Filtered by 1 rule' }).click({ force: true })
    await expect(page.getByRole('gridcell', { name: '789' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: '456' })).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: '123' })).not.toBeVisible()

    await deleteTable(page, ref, tableName)
  })

  test('view table definition works as expected', async ({ page, ref }) => {
    const tableName = 'pw_table_definition'
    const colName = 'pw_column'
    if (!page.url().includes('/editor')) {
      const tableLoadPromise = waitForTableToLoad(page, ref)
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await tableLoadPromise
    }
    await createTable(page, ref, tableName)
    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)
    const apiPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-definition-')
    await page.getByText('definition', { exact: true }).click()
    await apiPromise
    await expect(page.locator('.view-lines')).toContainText(
      `create table public.${tableName} (  id bigint generated by default as identity not null,  created_at timestamp with time zone null default now(),  ${colName} text null,  constraint ${tableName}_pkey primary key (id)) TABLESPACE pg_default;`
    )
    await deleteTable(page, ref, tableName)
  })

  test('sorting rows works as expected', async ({ page, ref }) => {
    const tableName = 'pw_table_sorting'
    const colName = 'pw_column'

    // Ensure we're on editor
    if (!page.url().includes('/editor')) {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await waitForTableToLoad(page, ref)
    }

    // Create a small table and three rows
    await createTable(page, ref, tableName)
    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    for (const value of ['789', '456', '123']) {
      await page.getByTestId('table-editor-insert-new-row').click()
      await page.getByRole('menuitem', { name: 'Insert row Insert a new row' }).click()
      await page.getByTestId(`${colName}-input`).fill(value)
      await page.getByTestId('action-bar-save-row').click()
      await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' })
    }

    // Apply sorting
    await page.getByRole('button', { name: 'Sort', exact: true }).click()
    await page.getByRole('button', { name: 'Pick a column to sort by' }).click()
    await page.getByRole('menuitem', { name: colName }).click()
    const waitForSortingApply = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=table-rows-'
    )
    await page.getByRole('button', { name: 'Apply sorting' }).click()
    await waitForSortingApply
    await page.getByRole('button', { name: 'Sorted by 1 rule' }).click()

    // Verify sorted row content asc lexicographically for strings
    await page.waitForTimeout(500)
    expect(await page.getByRole('gridcell').nth(3).textContent()).toBe('123')
    expect(await page.getByRole('gridcell').nth(8).textContent()).toBe('456')
    expect(await page.getByRole('gridcell').nth(13).textContent()).toBe('789')

    // Cleanup
    await deleteTable(page, ref, tableName)
  })

  test('importing, pagination and large data actions works as expected', async ({ page, ref }) => {
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    const tableNameDataActions = 'pw_table_data'

    // create table
    await createTable(page, ref, tableNameDataActions)
    await page.getByRole('button', { name: `View ${tableNameDataActions}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    // importing 50 data via csv file
    const csvFilePath = path.join(import.meta.dirname, 'files', 'table-editor-import-file.csv')
    await page.getByRole('button', { name: 'Import data from CSV' }).click()
    await page.getByRole('tab', { name: 'Upload CSV' }).click()
    await page.setInputFiles('input[type="file"]', csvFilePath)
    await expect(page.getByText('A total of 50 rows will be')).toBeVisible()
    const waitForCsvInsert = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=', {
      method: 'POST',
    })
    await page.getByRole('button', { name: 'Import data' }).click()
    await waitForCsvInsert // insert data
    await waitForGridDataToLoad(page, ref) // retrieve updated data
    await expect(page.getByText('50 records')).toBeVisible()

    // importing 51 data via paste text
    const filePath = path.join(import.meta.dirname, 'files', 'table-editor-import-paste.txt')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Import data from CSV' }).click()
    await page.getByRole('tab', { name: 'Paste text' }).click()
    await page.getByRole('textbox').fill(fileContent)
    await expect(page.getByText('A total of 51 rows will be')).toBeVisible()
    const waitForPasteInsert = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=', {
      method: 'POST',
    })
    await page.getByRole('button', { name: 'Import data' }).click()
    await waitForPasteInsert // insert data
    await waitForGridDataToLoad(page, ref) // retrieve updated data
    await expect(page.getByText('101 records')).toBeVisible()

    // test pagination (page 1 -> page 2)
    await expect(page.getByRole('gridcell', { name: 'value 7', exact: true })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'value 101', exact: true })).not.toBeVisible()
    const waitForPageChange = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-rows-')
    await page.getByLabel('Table grid footer').getByRole('button').nth(1).click()
    await waitForPageChange // retrieve next page data
    await expect(page.getByRole('gridcell', { name: 'value 7', exact: true })).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'value 101', exact: true })).toBeVisible()

    // change pagination size (100 -> 500)
    await page.getByRole('button', { name: 'rows' }).click()
    const waitForPaginationChange = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=table-rows-'
    )
    await page.getByRole('menuitem', { name: '500 rows' }).click()
    await waitForPaginationChange // retrieve updated pagination size data
    await expect(page.getByRole('gridcell', { name: 'value 7', exact: true })).toBeVisible()
    await page.getByRole('grid').evaluate((element) => {
      element.scrollTop = element.scrollHeight
    }) // scroll to bottom
    await expect(page.getByRole('gridcell', { name: 'value 101', exact: true })).toBeVisible()

    // remove selected rows when multiple rows action is selected
    await page.getByRole('grid').evaluate((element) => {
      element.scrollTop = 0
    }) // scroll to top
    await page.getByRole('row', { name: 'value 1 to delete' }).getByRole('checkbox').click()
    await page.getByRole('row', { name: 'value 2 to delete' }).getByRole('checkbox').click()
    await page.getByRole('row', { name: 'value 3 to delete' }).getByRole('checkbox').click()
    await page.getByRole('button', { name: 'Delete 3 rows' }).click()
    await expect(page.getByText('delete the selected 3 rows')).toBeVisible()
    const waitForDeleteRows = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=', {
      method: 'POST',
    })
    await page.getByRole('button', { name: 'Delete' }).click()
    await waitForDeleteRows // delete selected rows
    await waitForGridDataToLoad(page, ref) // retrieve row data

    // export selected rows when multiple rows action is selected
    await page.getByRole('row', { name: 'value 4 to export' }).getByRole('checkbox').click()
    await page.getByRole('row', { name: 'value 5 to export' }).getByRole('checkbox').click()
    await page.getByRole('row', { name: 'value 6 to export' }).getByRole('checkbox').click()

    await page.getByRole('button', { name: 'Export' }).click()
    const [downloadSql] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('menuitem', { name: 'Export as SQL' }).click(),
    ])
    expect(downloadSql.suggestedFilename()).toContain('.sql')
    const downloadSqlPath = await downloadSql.path()
    const sqlContent = fs.readFileSync(downloadSqlPath, 'utf-8')
    expect(sqlContent).toBe(
      `INSERT INTO "public"."${tableNameDataActions}" ("id", "created_at", "pw_column") VALUES ('4', '2025-01-01 12:00:00+00', 'value 4 to export'), ('5', '2025-01-01 12:00:00+00', 'value 5 to export'), ('6', '2025-01-01 12:00:00+00', 'value 6 to export');`
    )
    await page.waitForTimeout(1000) // wait for event processing to complete
    fs.unlinkSync(downloadSqlPath)

    // Close menu to prevent overlap with next export
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    await page.getByRole('button', { name: 'Export' }).click()
    const [downloadJson] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('menuitem', { name: 'Export as JSON' }).click(),
    ])
    expect(downloadJson.suggestedFilename()).toContain('.json')
    const downloadJsonPath = await downloadJson.path()
    const jsonContent = fs.readFileSync(downloadJsonPath, 'utf-8')
    expect(jsonContent).toBe(
      `[{"id":4,"created_at":"2025-01-01 12:00:00+00","pw_column":"value 4 to export"},{"id":5,"created_at":"2025-01-01 12:00:00+00","pw_column":"value 5 to export"},{"id":6,"created_at":"2025-01-01 12:00:00+00","pw_column":"value 6 to export"}]`
    )
    await page.waitForTimeout(1000) // wait for event processing to complete
    fs.unlinkSync(downloadJsonPath)

    // Close menu to prevent overlap with next export
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    await page.getByRole('button', { name: 'Export' }).click()
    const [downloadCsv] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('menuitem', { name: 'Export as CSV' }).click(),
    ])
    expect(downloadCsv.suggestedFilename()).toContain('.csv')
    const downloadCsvPath = await downloadCsv.path()
    const csvContent = fs.readFileSync(downloadCsvPath, 'utf-8').replace(/\r?\n/g, '\n')
    const rows = csvContent.trim().split('\n')
    const defaultColumnValues = rows.map((row) => {
      const columns = row.split(',')
      return columns[2].trim()
    })
    const expectedDefaultColumnValues = [
      columnName,
      'value 4 to export',
      'value 5 to export',
      'value 6 to export',
    ]
    defaultColumnValues.forEach((expectedValue) => {
      expect(expectedDefaultColumnValues).toContain(expectedValue)
    })
    await page.waitForTimeout(1000) // wait for event processing to complete
    fs.unlinkSync(downloadCsvPath)

    // Close menu to avoid leaving it open
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // select all actions works (delete action)
    await page.getByRole('checkbox', { name: 'Select All' }).click()
    await page.getByRole('button', { name: 'Delete 98 rows' }).click()
    const waitForDeleteAllRows = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=', {
      method: 'POST',
    })
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('delete the selected 98 rows')).toBeVisible()
    await waitForDeleteAllRows // delete all rows
    await waitForGridDataToLoad(page, ref) // retrieve rows data
    await expect(page.getByRole('gridcell', { name: 'value 7' })).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'value 101' })).not.toBeVisible()

    await deleteTable(page, ref, tableNameDataActions)
  })

  test('copying cell values from first and second row works', async ({ page, ref }) => {
    const tableName = 'pw_table_copy_rows'
    const colName = 'pw_column'

    // Ensure we're on editor
    if (!page.url().includes('/editor')) {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await waitForTableToLoad(page, ref)
    }

    // Create table and add two rows
    await createTable(page, ref, tableName)
    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    // Insert first row with value 'first_row_value'
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row Insert a new row' }).click()
    await page.getByTestId(`${colName}-input`).fill('first_row_value')
    await page.getByTestId('action-bar-save-row').click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' })

    // Insert second row with value 'second_row_value'
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row Insert a new row' }).click()
    await page.getByTestId(`${colName}-input`).fill('second_row_value')
    await page.getByTestId('action-bar-save-row').click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' })

    // Wait for grid to be visible
    await expect(page.getByRole('grid')).toBeVisible()

    // Right-click on the first row's cell to open context menu
    const firstRowCell = page.getByRole('gridcell', { name: 'first_row_value' })
    await expect(firstRowCell).toBeVisible()
    await firstRowCell.click({ button: 'right' })

    // Click "Copy cell" from context menu
    await page.getByRole('menuitem', { name: 'Copy cell' }).click()
    await page.waitForTimeout(500)

    // Verify first row value was copied
    const firstCopiedValue = await page.evaluate(() => navigator.clipboard.readText())
    expect(firstCopiedValue).toBe('first_row_value')

    // Right-click on the second row's cell to open context menu
    const secondRowCell = page.getByRole('gridcell', { name: 'second_row_value' })
    await expect(secondRowCell).toBeVisible()
    await secondRowCell.click({ button: 'right' })

    // Click "Copy cell" from context menu
    await page.getByRole('menuitem', { name: 'Copy cell' }).click()
    await page.waitForTimeout(500)

    // Verify second row value was copied
    const secondCopiedValue = await page.evaluate(() => navigator.clipboard.readText())
    expect(secondCopiedValue).toBe('second_row_value')

    // Cleanup
    await deleteTable(page, ref, tableName)
  })

  test('boolean fields can be edited correctly', async ({ page, ref }) => {
    const tableName = 'pw_table_boolean_edits'
    const boolColName = 'is_active'

    if (!page.url().includes('/editor')) {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await waitForTableToLoad(page, ref)
    }

    await dismissToastsIfAny(page)

    // Create a simple table with a boolean column
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await page.getByTestId('table-name-input').fill(tableName)
    await page.getByTestId('created_at-extra-options').click()
    await page.getByRole('checkbox', { name: 'Is Nullable' }).click()
    await page.getByTestId('created_at-extra-options').click({ force: true })

    // Add boolean column
    await page.getByRole('button', { name: 'Add column' }).click()
    await page.getByRole('textbox', { name: 'column_name' }).fill(boolColName)
    await page.getByText('Choose a column type...').click()
    await page.getByPlaceholder('Search types...').fill('bool')
    await page.getByRole('option', { name: 'bool' }).first().click()

    await page.getByRole('button', { name: 'Save' }).click()
    await expect(
      page.getByText(`Table ${tableName} is good to go!`),
      'Success toast should be visible after table creation'
    ).toBeVisible({ timeout: 50000 })

    await expect(
      page.getByRole('button', { name: `View ${tableName}`, exact: true }),
      'Table should be visible after creation'
    ).toBeVisible()

    // Navigate to the table
    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    // Insert a row with TRUE value via side panel
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row Insert a new row' }).click()
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'TRUE' }).click()
    await page.getByTestId('action-bar-save-row').click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' })

    await expect(
      page.getByRole('gridcell', { name: 'TRUE' }),
      'TRUE value should be displayed'
    ).toBeVisible()

    // Insert a row with FALSE value via side panel
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row Insert a new row' }).click()
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'FALSE' }).click()
    await page.getByTestId('action-bar-save-row').click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' })

    // Verify FALSE value is preserved
    await expect(
      page.getByRole('gridcell', { name: 'FALSE' }),
      'FALSE value should be displayed and preserved'
    ).toBeVisible()

    // Edit the FALSE value to TRUE using inline editor
    const falseCell = page.getByRole('gridcell', { name: 'FALSE' }).first()
    await falseCell.dblclick()

    // Wait for boolean editor dropdown to appear
    const booleanEditor = page.locator('#boolean-editor')
    await expect(booleanEditor, 'Boolean editor should be visible').toBeVisible()

    // Change from false to true
    await booleanEditor.selectOption('true')
    const updateTrueResponse = waitForApiResponse(page, 'pg-meta', ref, 'query?key=', {
      method: 'POST',
    })
    await page.getByRole('columnheader', { name: 'id' }).click()
    await updateTrueResponse

    // Verify the value changed to TRUE (now there should be 2 TRUE values in the table)
    await expect(
      page.getByRole('gridcell', { name: 'TRUE' }),
      'Value should change to TRUE after inline edit'
    ).toHaveCount(2)

    // Edit TRUE value back to FALSE using inline editor
    // Use the second TRUE cell (the one we just edited from FALSE to TRUE)
    const trueCell = page.getByRole('gridcell', { name: 'TRUE' }).nth(1)
    await trueCell.dblclick()

    await expect(booleanEditor, 'Boolean editor should be visible for second edit').toBeVisible()
    await booleanEditor.selectOption('false')
    const updateFalseResponse = waitForApiResponse(page, 'pg-meta', ref, 'query?key=', {
      method: 'POST',
    })
    await page.getByRole('columnheader', { name: 'id' }).click()
    await updateFalseResponse

    // Verify FALSE value is preserved and not converted to NULL (this is the critical regression test)
    const falseCells = page.getByRole('gridcell', { name: 'FALSE' })
    await expect(
      falseCells.first(),
      'FALSE value should be preserved and not become NULL after inline edit'
    ).toBeVisible()

    // Cleanup
    await deleteTable(page, ref, tableName)
  })

  test('nullable boolean fields support NULL values', async ({ page, ref }) => {
    const tableName = 'pw_table_boolean_nullable'
    const boolColName = 'is_enabled'

    if (!page.url().includes('/editor')) {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await waitForTableToLoad(page, ref)
    }

    await dismissToastsIfAny(page)

    // Create a table with a nullable boolean column
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await page.getByTestId('table-name-input').fill(tableName)
    await page.getByTestId('created_at-extra-options').click()
    await page.getByRole('checkbox', { name: 'Is Nullable' }).click()
    await page.getByTestId('created_at-extra-options').click({ force: true })

    // Add nullable boolean column
    await page.getByRole('button', { name: 'Add column' }).click()
    await page.getByRole('textbox', { name: 'column_name' }).fill(boolColName)
    await page.getByText('Choose a column type...').click()
    await page.getByPlaceholder('Search types...').fill('bool')
    await page.getByRole('option', { name: 'bool' }).first().click()

    await page.getByRole('button', { name: 'Save' }).click()
    await expect(
      page.getByText(`Table ${tableName} is good to go!`),
      'Success toast should be visible after table creation'
    ).toBeVisible({ timeout: 50000 })

    await expect(
      page.getByRole('button', { name: `View ${tableName}`, exact: true }),
      'Table should be visible after creation'
    ).toBeVisible()

    // Navigate to the table
    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    // Insert a row with TRUE value
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row Insert a new row' }).click()
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'TRUE' }).click()
    await page.getByTestId('action-bar-save-row').click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' })

    await expect(
      page.getByRole('gridcell', { name: 'TRUE' }),
      'TRUE value should be displayed'
    ).toBeVisible()

    // Insert a row with FALSE value
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Insert row Insert a new row' }).click()
    await page.getByRole('combobox').click()
    await page.getByRole('option', { name: 'FALSE' }).click()
    await page.getByTestId('action-bar-save-row').click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' })

    await expect(
      page.getByRole('gridcell', { name: 'FALSE' }),
      'FALSE value should be displayed'
    ).toBeVisible()

    // Edit FALSE to NULL using inline editor
    const falseCellToNull = page.getByRole('gridcell', { name: 'FALSE' })
    await falseCellToNull.dblclick()

    const booleanEditor = page.locator('#boolean-editor')
    await expect(booleanEditor, 'Boolean editor should be visible').toBeVisible()

    await booleanEditor.selectOption('null')

    const updateNullResponse = waitForApiResponse(page, 'pg-meta', ref, 'query?key=', {
      method: 'POST',
    })
    await page.getByRole('columnheader', { name: 'id' }).click()
    await updateNullResponse

    // Verify value changed to NULL on the second row
    const nullCells = page.getByRole('gridcell', { name: 'NULL' })
    await expect(nullCells, 'FALSE should change to NULL after inline edit').toBeVisible()

    // Edit NULL to FALSE using inline editor
    const nullCellToFalse = page.getByRole('gridcell', { name: 'NULL' })
    await nullCellToFalse.dblclick()

    await booleanEditor.selectOption('false')

    const updateFalseResponse = waitForApiResponse(page, 'pg-meta', ref, 'query?key=', {
      method: 'POST',
    })
    await page.getByRole('columnheader', { name: 'id' }).click()
    await updateFalseResponse

    await expect(
      page.getByRole('gridcell', { name: 'FALSE' }),
      'NULL should change to FALSE after inline edit'
    ).toBeVisible()

    // Cleanup
    await deleteTable(page, ref, tableName)
  })

  test('can create and remove foreign key with column selection', async ({ page, ref }) => {
    const sourceTableName = 'pw_table_fk_source'
    const targetTableName = 'pw_table_fk_target'

    if (!page.url().includes('/editor')) {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await waitForTableToLoad(page, ref)
    }

    await dismissToastsIfAny(page)

    // Create target table first (will be referenced)
    await createTable(page, ref, targetTableName)

    // Create source table (will have the foreign key)
    await createTable(page, ref, sourceTableName)
    await page.getByRole('button', { name: `View ${sourceTableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    // Open edit table dialog
    await page
      .getByRole('button', { name: `View ${sourceTableName}`, exact: true })
      .locator('button[aria-haspopup="menu"]')
      .click()
    await page.getByRole('menuitem', { name: 'Edit table' }).click()

    // Open foreign key selector
    await page.getByRole('button', { name: 'Add foreign key relation' }).click()

    // Select schema (should default to public)
    await expect(page.getByRole('button', { name: 'Select a schema' })).toContainText('public')

    // Select target table
    const tableQueryPromise = waitForApiResponseWithTimeout(page, (response) =>
      response.url().includes(`table-public-${targetTableName}`)
    )

    await page.getByRole('button', { name: 'Select a table to reference to' }).click()
    await page.getByRole('menuitem', { name: `public ${targetTableName}` }).click()

    // Wait for table columns to load
    await tableQueryPromise

    // Verify column selection UI appears
    await expect(
      page.getByText(`Select columns from public.${targetTableName} to reference to`)
    ).toBeVisible()

    // Select source column (id from source table)
    await page.getByRole('button', { name: '---' }).first().click()
    await page.getByRole('menuitem', { name: 'id int8' }).click()

    // Wait for the first dropdown to update - there should only be one '---' button left now
    await expect(page.getByRole('button', { name: '---' })).toHaveCount(1)

    // Select target column (id from target table)
    await page.getByRole('button', { name: '---' }).first().click()
    await page.getByRole('menuitem', { name: 'id int8' }).click()

    // Verify cascade action options are visible
    await expect(page.getByText('Action if referenced row is updated')).toBeVisible()
    await expect(page.getByText('Action if referenced row is removed')).toBeVisible()

    // Verify save button is now enabled
    const saveButton = page.getByRole('button', { name: 'Save' }).last()
    await expect(saveButton).toBeEnabled()

    // Save the foreign key
    const fkCreatePromise = waitForApiResponseWithTimeout(page, (response) =>
      response.url().includes('query?key=')
    )
    await saveButton.click()
    await fkCreatePromise

    // Verify foreign key selector closed
    await expect(
      page.getByRole('banner', { name: `Add foreign key relationship to ${sourceTableName}` })
    ).not.toBeVisible()

    // Save table changes
    const saveTablePromise = waitForApiResponseWithTimeout(
      page,
      (response) => response.url().includes('query?key=table-update'),
      15000
    )
    await page.getByRole('button', { name: 'Save' }).first().click()
    await saveTablePromise

    // Wait for table editor side panel to close
    await expect(page.getByTestId('table-editor-side-panel')).not.toBeVisible()

    // Verify foreign key was created by opening edit table dialog again
    await page
      .getByRole('button', { name: `View ${sourceTableName}`, exact: true })
      .locator('button[aria-haspopup="menu"]')
      .click()
    await page.getByRole('menuitem', { name: 'Edit table' }).click()

    // Scroll down to see foreign key relations section
    await page.getByRole('heading', { name: 'Foreign keys' }).scrollIntoViewIfNeeded()

    // Verify foreign key relation exists
    await expect(page.getByRole('link', { name: 'public.pw_table_fk_target' })).toBeVisible()

    // Remove the foreign key relation
    await page.getByRole('button', { name: 'Remove' }).click()

    // Save the table changes after removing foreign key
    const removeFkPromise = waitForApiResponseWithTimeout(
      page,
      (response) => response.url().includes('query?key=table-update'),
      15000
    )
    await page.getByRole('button', { name: 'Save' }).first().click()
    await removeFkPromise

    // Wait for table editor side panel to close
    await expect(page.getByTestId('table-editor-side-panel')).not.toBeVisible()

    // Verify foreign key was removed by opening edit table dialog again
    await page
      .getByRole('button', { name: `View ${sourceTableName}`, exact: true })
      .locator('button[aria-haspopup="menu"]')
      .click()
    await page.getByRole('menuitem', { name: 'Edit table' }).click()

    // Scroll down to see foreign key relations section
    await page.getByRole('heading', { name: 'Foreign keys' }).scrollIntoViewIfNeeded()
    // Verify foreign key relation no longer exists
    await expect(page.getByText(`public.${targetTableName}`, { exact: false })).not.toBeVisible()

    // Close the edit table dialog
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByTestId('table-editor-side-panel')).not.toBeVisible()

    // Clean up
    await deleteTable(page, ref, sourceTableName)
    await deleteTable(page, ref, targetTableName)
  })

  test('CSV drag and drop imports data on empty table', async ({ page, ref }) => {
    const tableName = 'pw_table_csv_drag_drop'

    await dropTable(tableName)
    await dbCreateTable(tableName, columnName)

    const loadPromise = waitForTableToLoad(page, ref)
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await loadPromise

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await expect(
      page.getByText('or drag and drop a CSV file here'),
      'Empty table should show drag and drop hint'
    ).toBeVisible()

    const csvFilePath = path.join(import.meta.dirname, 'files', 'table-editor-drag-drop.csv')
    const csvBuffer = fs.readFileSync(csvFilePath)

    // Synthesize a DataTransfer with the CSV file to simulate a browser file drag-and-drop
    const dataTransfer = await page.evaluateHandle((csvBase64: string) => {
      const dt = new DataTransfer()
      const bytes = Uint8Array.from(atob(csvBase64), (c) => c.charCodeAt(0))
      const file = new File([bytes], 'table-editor-drag-drop.csv', { type: 'text/csv' })
      dt.items.add(file)
      return dt
    }, csvBuffer.toString('base64'))

    const gridContainer = page.getByTestId('table-editor-grid-container')

    await gridContainer.dispatchEvent('dragover', { dataTransfer })
    await expect(
      page.getByText('Drop your CSV file here'),
      'Drag feedback should show when CSV is dragged over'
    ).toBeVisible()

    await gridContainer.dispatchEvent('drop', { dataTransfer })

    await expect(
      page.getByText('A total of 3 rows will be'),
      'Import dialog should show correct row count from CSV'
    ).toBeVisible({ timeout: 10_000 })

    const waitForCsvInsert = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=', {
      method: 'POST',
    })
    await page.getByRole('button', { name: 'Import data' }).click()
    await waitForCsvInsert
    await waitForGridDataToLoad(page, ref)

    await expect(
      page.getByText('3 records'),
      'Table should show 3 records after drag and drop import'
    ).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'drag drop value 1' })).toBeVisible()

    await dropTable(tableName)
  })
})
