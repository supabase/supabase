import { expect, Locator, Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { test } from '../utils/test'
import { toUrl } from '../utils/to-url'
import {
  waitForApiResponse,
  waitForGridDataToLoad,
  waitForTableToLoad,
} from '../utils/wait-for-response'
import { resetLocalStorage } from '../utils/reset-local-storage'
import { isCLI } from '../utils/is-cli'
import { waitForApiResponseWithTimeout } from '../utils/wait-for-response-with-timeout'

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
  await page.getByTestId('created_at-extra-options').click()
  await page.getByText('Is Nullable').click()
  await page.getByTestId('created_at-extra-options').click({ force: true })
  await page.getByRole('button', { name: 'Add column' }).click()
  await page.getByRole('textbox', { name: 'column_name' }).fill(columnName)
  await page.getByText('Choose a column type...').click()
  await page.getByRole('option', { name: 'text Variable-length' }).click()
  await page.getByRole('button', { name: 'Save' }).click()
  // Wait specifically for tables list refresh instead of generic networkidle
  await waitForApiResponseWithTimeout(page, (response) =>
    response.url().includes('tables?include_columns=true&included_schemas=public')
  )
  // wait for tables to load, we don't need to wait here cause this response may complete before the table creation.
  await waitForApiResponseWithTimeout(page, (response) =>
    response.url().includes('query?key=entity-types-public-')
  )
  await expect(
    page.getByRole('button', { name: `View ${tableName}`, exact: true }),
    'Table should be visible after creation'
  ).toBeVisible({ timeout: 10000 })
}

const deleteTable = async (page: Page, ref: string, tableName: string) => {
  const viewLocator = page.getByLabel(`View ${tableName}`)
  if ((await viewLocator.count()) === 0) return
  await viewLocator.nth(0).click()
  await viewLocator.getByRole('button').nth(1).click({ force: true })
  await page.getByText('Delete table').click()
  await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).click()
  await page.getByRole('button', { name: 'Delete' }).click()
  await waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-delete-', { method: 'POST' })
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

test.describe.serial('table editor', () => {
  let page: Page

  test.beforeEach(async ({ ref }) => {
    await resetLocalStorage(page, ref)
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await waitForTableToLoad(page, ref)
  })

  test.beforeAll(async ({ browser, ref }) => {
    page = await browser.newPage()
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await waitForTableToLoad(page, ref)

    // Delete all tables with prefix pw_table (ensure page is stable first)
    const viewButtons = page.getByRole('button', { name: /^View / })
    const names = (await viewButtons.allTextContents()).map((t) => t.replace(/^View\s+/, '').trim())
    const tablesToDelete = names.filter((tableName) => tableName.startsWith(tableNamePrefix))

    for (const tableName of tablesToDelete) {
      await deleteTable(page, ref, tableName)
      await waitForTableToLoad(page, ref) // wait for table data to update
    }
  })

  test.afterAll(async ({ ref }) => {
    await resetLocalStorage(page, ref)

    // Always navigate explicitly to editor and wait for tables to be loaded
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await waitForTableToLoad(page, ref)

    // Delete all tables with prefix pw_table
    const viewButtons = page.getByRole('button', { name: /^View / })
    const names = (await viewButtons.allTextContents()).map((t) => t.replace(/^View\s+/, '').trim())
    const tablesToDelete = names.filter((tableName) => tableName.startsWith(tableNamePrefix))

    for (const tableName of tablesToDelete) {
      await deleteTable(page, ref, tableName)
      await waitForTableToLoad(page, ref) // wait for table data to update
    }
  })

  test('sidebar actions works as expected', async ({ ref }) => {
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
      .nth(1)
      .click()
    await page.getByRole('menuitem', { name: 'Copy name' }).click()
    await page.waitForTimeout(500)
    const copiedTableResult = await page.evaluate(() => navigator.clipboard.readText())
    expect(copiedTableResult).toBe('pw_table_actions')

    // copies table schema to clipboard when copy schema option is clicked
    await page
      .getByRole('button', { name: `View ${tableNameActions}`, exact: true })
      .getByRole('button')
      .nth(1)
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
      .nth(1)
      .click()
    await page.getByRole('menuitem', { name: 'Duplicate table' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' }) // create duplicate table
    await waitForTableToLoad(page, ref) // load tables
    await expect(
      page.getByLabel(`View ${tableNameActionsDuplicate}`, { exact: true })
    ).toBeVisible()

    await deleteTable(page, ref, tableNameActionsDuplicate)
    await deleteTable(page, ref, tableNameActions)
  })

  test('switching schemas work as expected', async ({ ref }) => {
    const authTableSso = 'identities'
    const authTableMfa = 'mfa_factors'

    // change schema from public to auth
    await page.getByTestId('schema-selector').click()
    await page.getByPlaceholder('Find schema...').fill('auth')
    await page.getByRole('option', { name: 'auth' }).click()
    await waitForTableToLoad(page, ref, 'auth') // load auth tables
    await expect(page.getByLabel(`View ${authTableSso}`)).toBeVisible()
    await expect(page.getByLabel(`View ${authTableMfa}`)).toBeVisible()

    // filter by querying
    await page.getByRole('textbox', { name: 'Search tables...' }).fill('mfa')
    await waitForTableToLoad(page, ref, 'auth') // load tables
    await expect(page.getByLabel(`View ${authTableSso}`)).not.toBeVisible()
    await expect(page.getByLabel(`View ${authTableMfa}`)).toBeVisible()

    // navigate to policies page when view policies action is clicked
    await page.getByRole('button', { name: `View ${authTableMfa}` }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=auth$/)
    await page
      .getByRole('button', { name: `View ${authTableMfa}` })
      .getByRole('button')
      .nth(1)
      .click()
    await page.getByRole('menuitem', { name: 'View policies' }).click()
    await page.waitForURL(/.*\/policies\?schema=auth/)
    expect(page.url()).toContain('auth/policies?schema=auth')
  })

  test('should show rls accordingly', async ({ ref }) => {
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
    await page.getByRole('button', { name: 'Save' }).click()
    await waitForApiResponse(
      page,
      'pg-meta',
      ref,
      'tables?include_columns=true&included_schemas=public'
    ) // wait for table creation
    await page.getByRole('button', { name: `View ${tableNameRlsDisabled}` }).click()
    await expect(page.getByRole('button', { name: 'RLS disabled' })).toBeVisible()

    // clear all tables
    await deleteTable(page, ref, tableNameRlsEnabled)
    await deleteTable(page, ref, tableNameRlsDisabled)
  })

  test('add enums and show enums on table', async ({ ref }) => {
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

    // Wait for the grid to be visible and data to be loaded
    await expect(
      page.getByRole('grid'),
      'Grid should be visible after inserting data'
    ).toBeVisible()
    await expect(page.getByRole('columnheader', { name: enum_name })).toBeVisible()

    // insert row with enum value
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByText('Insert a new row into').click()
    await page.getByRole('combobox').selectOption('value1')
    await page.getByTestId('action-bar-save-row').click()
    await expect(page.getByRole('gridcell', { name: 'value1' })).toBeVisible()

    // insert row with another enum value
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByText('Insert a new row into').click()
    await page.getByRole('combobox').selectOption('value2')
    await page.getByTestId('action-bar-save-row').click()
    await expect(page.getByRole('gridcell', { name: 'value2' })).toBeVisible()

    // delete enum and enum table
    await deleteTable(page, ref, tableNameEnum)
    await page.goto(toUrl(`/project/${ref}/database/types?schema=public`))
    await deleteEnumIfExist(page, ref, enum_name)

    // clear local storage, as it might result in some flakiness
    await resetLocalStorage(page, ref)
  })

  test('Grid editor exporting works as expected', async ({ ref }) => {
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
      .nth(1)
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
      .nth(1)
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
      .nth(1)
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
      .nth(1)
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

    // Ensure all menus/dialogs are closed before continuing
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  })

  test('filtering rows works as expected', async ({ ref }) => {
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
      await page.getByTestId('action-bar-save-row').click()
      await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' })
    }

    await page.getByRole('button', { name: 'Filter', exact: true }).click()
    await page.getByRole('button', { name: 'Add filter' }).click()
    await page.getByRole('button', { name: 'id' }).click()
    await page.getByRole('menuitem', { name: colName }).click()
    await page.getByRole('textbox', { name: 'Enter a value' }).fill('789')
    await page.getByRole('button', { name: 'Apply filter' }).click()
    await waitForGridDataToLoad(page, ref)
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Filtered by 1 rule' }).click({ force: true })
    await expect(page.getByRole('gridcell', { name: '789' })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: '456' })).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: '123' })).not.toBeVisible()

    await deleteTable(page, ref, tableName)
  })

  test('view table definition works as expected', async ({ ref }) => {
    const tableName = 'pw_table_definition'
    const colName = 'pw_column'
    if (!page.url().includes('/editor')) {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await waitForTableToLoad(page, ref)
    }
    await createTable(page, ref, tableName)
    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)
    await page.getByText('definition', { exact: true }).click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-definition-')
    await expect(page.locator('.view-lines')).toContainText(
      `create table public.${tableName} (  id bigint generated by default as identity not null,  created_at timestamp with time zone null default now(),  ${colName} text null,  constraint ${tableName}_pkey primary key (id)) TABLESPACE pg_default;`
    )
    await deleteTable(page, ref, tableName)
  })

  test('sorting rows works as expected', async ({ ref }) => {
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
    await page.getByRole('button', { name: 'Apply sorting' }).click()
    await waitForGridDataToLoad(page, ref)
    await page.getByRole('button', { name: 'Sorted by 1 rule' }).click()

    // Verify sorted row content asc lexicographically for strings
    await page.waitForTimeout(500)
    expect(await page.getByRole('gridcell').nth(3).textContent()).toBe('123')
    expect(await page.getByRole('gridcell').nth(8).textContent()).toBe('456')
    expect(await page.getByRole('gridcell').nth(13).textContent()).toBe('789')

    // Cleanup
    await deleteTable(page, ref, tableName)
  })

  test('importing, pagination and large data actions works as expected', async ({ ref }) => {
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    const tableNameDataActions = 'pw_table_data'

    // create table
    await createTable(page, ref, tableNameDataActions)
    await page.getByRole('button', { name: `View ${tableNameDataActions}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    // importing 50 data via csv file
    const csvFilePath = path.join(__dirname, 'files', 'table-editor-import-file.csv')
    await page.getByRole('button', { name: 'Import data from CSV' }).click()
    await page.getByRole('tab', { name: 'Upload CSV' }).click()
    await page.setInputFiles('input[type="file"]', csvFilePath)
    await expect(page.getByText('A total of 50 rows will be')).toBeVisible()
    await page.getByRole('button', { name: 'Import data' }).click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' }) // insert data
    await waitForGridDataToLoad(page, ref) // retrieve updated data
    await expect(page.getByText('50 records')).toBeVisible()

    // importing 51 data via paste text
    const filePath = path.join(__dirname, 'files', 'table-editor-import-paste.txt')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    await page.getByRole('button', { name: 'Close toast' }).first().click() // close toast, as paste text is behind toast
    await page.getByTestId('table-editor-insert-new-row').click()
    await page.getByRole('menuitem', { name: 'Import data from CSV' }).click()
    await page.getByRole('tab', { name: 'Paste text' }).click()
    await page.getByRole('textbox').fill(fileContent)
    await expect(page.getByText('A total of 51 rows will be')).toBeVisible()
    await page.getByRole('button', { name: 'Import data' }).click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' }) // insert data
    await waitForGridDataToLoad(page, ref) // retrieve updated data
    await expect(page.getByText('101 records')).toBeVisible()

    // test pagination (page 1 -> page 2)
    await expect(page.getByRole('gridcell', { name: 'value 7', exact: true })).toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'value 101', exact: true })).not.toBeVisible()
    let footer: Locator
    if (isCLI()) {
      footer = page.getByLabel('Table grid footer')
    } else {
      footer = page.locator('[data-sentry-component="GridFooter"]')
    }
    await footer.getByRole('button').nth(1).click()
    await waitForGridDataToLoad(page, ref) // retrieve next page data
    await expect(page.getByRole('gridcell', { name: 'value 7', exact: true })).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'value 101', exact: true })).toBeVisible()

    // change pagination size (100 -> 500)
    await page.getByRole('button', { name: 'rows' }).click()
    await page.getByRole('menuitem', { name: '500 rows' }).click()
    await waitForGridDataToLoad(page, ref) // retrieve updated pagination size data
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
    await page.getByRole('button', { name: 'Delete' }).click()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' }) // delete selected rows
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
      `[{"idx":0,"id":4,"created_at":"2025-01-01 12:00:00+00","pw_column":"value 4 to export"},{"idx":1,"id":5,"created_at":"2025-01-01 12:00:00+00","pw_column":"value 5 to export"},{"idx":2,"id":6,"created_at":"2025-01-01 12:00:00+00","pw_column":"value 6 to export"}]`
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
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('delete the selected 98 rows')).toBeVisible()
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=', { method: 'POST' }) // delete all rows
    await waitForGridDataToLoad(page, ref) // retrieve rows data
    await expect(page.getByRole('gridcell', { name: 'value 7' })).not.toBeVisible()
    await expect(page.getByRole('gridcell', { name: 'value 101' })).not.toBeVisible()

    await deleteTable(page, ref, tableNameDataActions)
  })
})
