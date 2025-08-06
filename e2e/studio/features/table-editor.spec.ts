import { expect, Page } from '@playwright/test'
import fs from 'fs'
import { test } from '../utils/test'
import { toUrl } from '../utils/to-url'

const getSelectors = (tableName: string) => ({
  tableButton: (page) => page.getByRole('button', { name: `View ${tableName}` }),
  newTableBtn: (page) => page.getByRole('button', { name: 'New table', exact: true }),
  tableNameInput: (page) => page.getByTestId('table-name-input'),
  createdAtExtraOptions: (page) => page.getByTestId('created_at-extra-options'),
  addColumnBtn: (page) => page.getByRole('button', { name: 'Add column' }),
  columnNameInput: (page) => page.getByRole('textbox', { name: 'column_name' }),
  chooseColumnType: (page) => page.locator('button').filter({ hasText: 'Choose a column type...' }),
  signedIntOption: (page) => page.getByText('Signed two-byte integer'),
  defaultValueField: (page) => page.getByTestId('defaultValueColumn-default-value'),
  saveBtn: (page) => page.getByRole('button', { name: 'Save' }),
  definitionTab: (page) => page.getByText('definition', { exact: true }),
  viewLines: (page) => page.locator('div.view-lines'),
  insertBtn: (page) => page.getByTestId('table-editor-insert-new-row'),
  insertRow: (page) => page.getByText('Insert a new row into'),
  insertColumn: (page) => page.getByText('Insert a new column into'),
  defaultValueInput: (page) => page.getByTestId('defaultValueColumn-input'),
  actionBarSaveRow: (page) => page.getByTestId('action-bar-save-row'),
  grid: (page) => page.getByRole('grid'),
  row: (page) => page.getByRole('row'),
  sortBtn: (page) => page.getByRole('button', { name: 'Sort', exact: true }),
  pickSortColumnBtn: (page) => page.getByTestId('table-editor-pick-column-to-sort-button'),
  sortColumnOption: (page) =>
    page.getByLabel('Pick a column to sort by').getByText('defaultValueColumn'),
  applySortingBtn: (page) => page.getByRole('button', { name: 'Apply sorting' }),
  sortedByRuleBtn: (page) => page.getByRole('button', { name: 'Sorted by 1 rule' }),
  filterBtn: (page) => page.getByRole('button', { name: 'Filter', exact: true }),
  addFilterBtn: (page) => page.getByRole('button', { name: 'Add filter' }),
  columnPickerBtn: (page) => page.getByRole('button', { name: 'id' }),
  filterColumnOption: (page) => page.getByLabel('id').getByText('defaultValueColumn'),
  filterInput: (page) => page.getByPlaceholder('Enter a value'),
  applyFilterBtn: (page) => page.getByRole('button', { name: 'Apply filter' }),
  viewTableLabel: (page) => page.getByLabel(`View ${tableName}`, { exact: true }),
  deleteTableBtn: (page) => page.getByText('Delete table'),
  confirmDeleteBtn: (page) => page.getByRole('button', { name: 'Delete' }),
  rlsCheckbox: (page) => page.getByLabel('Enable Row Level Security ('),
  rlsConfirmBtn: (page) => page.getByRole('button', { name: 'Confirm' }),
  deleteTableToast: (page, tableName) =>
    page.getByText(`Successfully deleted table "${tableName}"`),
})

const createTable = async (page: Page, tableName: string) => {
  const s = getSelectors(tableName)

  await s.newTableBtn(page).click()
  await s.tableNameInput(page).fill(tableName)

  await s.createdAtExtraOptions(page).click()
  await page.getByText('Is Nullable').click()
  await s.createdAtExtraOptions(page).click({ force: true })

  await s.addColumnBtn(page).click()
  await s.columnNameInput(page).fill('defaultValueColumn')
  await s.chooseColumnType(page).click()
  await s.signedIntOption(page).click()
  await s.defaultValueField(page).click()
  await s.defaultValueField(page).fill('2')

  await s.saveBtn(page).click()

  await expect(
    page.getByText(`Table ${tableName} is good to go!`),
    'Success toast should be visible after table creation'
  ).toBeVisible({
    timeout: 50000,
  })

  await expect(
    page.getByRole('button', { name: `View ${tableName}` }),
    'Table should be visible after creation'
  ).toBeVisible()
}

const deleteTable = async (page: Page, tableName: string) => {
  const s = getSelectors(tableName)

  await page.waitForTimeout(500)
  const exists = (await s.tableButton(page).count()) > 0
  if (!exists) return

  await s.viewTableLabel(page).click()
  await s.viewTableLabel(page).getByRole('button').nth(1).click()
  await s.deleteTableBtn(page).click()
  await s.confirmDeleteBtn(page).click()
  await expect(
    s.deleteTableToast(page, tableName),
    'Delete confirmation toast should be visible'
  ).toBeVisible()
}

const deleteEnum = async (page: Page, enumName: string, ref: string) => {
  // give it a second for interactions to load
  await page.waitForResponse(
    (response) =>
      response.url().includes(`pg-meta/${ref}/types`) ||
      response.url().includes('pg-meta/default/types')
  )

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
  await expect(page.getByText(`Successfully deleted "${enumName}"`)).toBeVisible()
}

test.describe('Table Editor', () => {
  let page: Page
  const testTableName = `pw-test-table-editor`
  const tableNameRlsEnabled = `pw-test-rls-enabled`
  const tableNameRlsDisabled = `pw-test-rls-disabled`
  const tableNameEnum = `pw-test-enum`
  const tableNameCsv = `pw-test-csv`

  test.beforeAll(async ({ browser, ref }) => {
    test.setTimeout(60000)

    /**
     * Create a new table for the tests
     */
    page = await browser.newPage()
    await page.goto(toUrl(`/project/${ref}/editor`))

    await page.waitForTimeout(2000)
    // delete table name if it exists
    await deleteTable(page, testTableName)
    await deleteTable(page, tableNameRlsEnabled)
    await deleteTable(page, tableNameRlsDisabled)
    await deleteTable(page, tableNameEnum)
    await deleteTable(page, tableNameCsv)
  })

  test.afterAll(async () => {
    test.setTimeout(60000)

    // delete all tables related to this test
    await deleteTable(page, testTableName)
    await deleteTable(page, tableNameRlsEnabled)
    await deleteTable(page, tableNameRlsDisabled)
    await deleteTable(page, tableNameEnum)
    await deleteTable(page, tableNameCsv)
  })

  test('should perform all table operations sequentially', async ({ ref }) => {
    await createTable(page, testTableName)
    const s = getSelectors(testTableName)
    test.setTimeout(60000)

    // 1. View table definition
    await page.evaluate(() => document.querySelector('.ReactQueryDevtools')?.remove())
    await s.definitionTab(page).click()
    await expect(
      s.viewLines(page),
      'Table definition should contain the correct SQL'
    ).toContainText(
      `create table public.pw - test - table - editor ( id bigint generated by default as identity not null, created_at timestamp with time zone null default now(), "defaultValueColumn" smallint null default '2'::smallint, constraint pw - test - table - editor_pkey primary key (id)) TABLESPACE pg_default;
      `
    )

    // 2. Insert test data
    await page.getByRole('button', { name: `View ${testTableName}` }).click()
    await s.insertBtn(page).click()
    await s.insertRow(page).click()
    await s.defaultValueInput(page).fill('100')
    await s.actionBarSaveRow(page).click()

    await page.getByRole('button', { name: `View ${testTableName}` }).click()
    await s.insertBtn(page).click()
    await s.insertRow(page).click()
    await s.defaultValueInput(page).fill('4')
    await s.actionBarSaveRow(page).click()

    // Wait for the grid to be visible and data to be loaded
    await expect(s.grid(page), 'Grid should be visible after inserting data').toBeVisible()

    // 3. Sort rows
    await s.sortBtn(page).click()
    await s.pickSortColumnBtn(page).click()
    await s.sortColumnOption(page).click()
    await s.applySortingBtn(page).click()
    await page.keyboard.down('Escape')

    // Wait for sorting to complete
    await page.waitForResponse(
      (response) =>
        response.url().includes(`pg-meta/${ref}/query`) ||
        response.url().includes('pg-meta/default/query')
    )

    // give it a second to rerender
    await page.waitForTimeout(1000)

    const defaultValueCells = page.getByRole('gridcell')

    const thirdGridCell = defaultValueCells.nth(3)
    const thirdGridCellText = await thirdGridCell.textContent()
    expect(thirdGridCellText, 'Third grid cell should contain the value "4"').toEqual('4')

    // 4. Filter rows
    await s.filterBtn(page).click()
    await s.addFilterBtn(page).click()
    await s.columnPickerBtn(page).click()
    await s.filterColumnOption(page).click()
    await s.filterInput(page).fill('4')
    await s.applyFilterBtn(page).click()
    await page.keyboard.down('Escape')

    await expect(
      s.grid(page).getByRole('gridcell', { name: '4', exact: true }),
      'Filtered value "4" should be visible'
    ).toBeVisible()
    await expect(
      s.grid(page).getByText('100'),
      'Filtered value "100" should not be visible'
    ).not.toBeVisible()

    // 5. Check auth schema
    await page.getByTestId('schema-selector').click()
    await page.getByRole('option', { name: 'auth' }).click()

    // Wait for the tables list to be visible
    await expect(
      page.getByTestId('tables-list'),
      'Tables list should be visible in auth schema'
    ).toBeVisible()

    // search for users
    await page.getByRole('textbox', { name: 'Search tables...' }).fill('users')

    // Try to find the users table directly
    const usersTable = page.getByRole('button', { name: 'View users' })
    await expect(usersTable, 'Users table should be visible in auth schema').toBeVisible()

    // go back to public schema
    await page.getByTestId('schema-selector').click()
    await page.getByRole('option', { name: 'public', exact: true }).click()

    // wait for the tables list to be visible
    await expect(
      page.getByTestId('tables-list'),
      'Tables list should be visible in public schema'
    ).toBeVisible()

    await deleteTable(page, testTableName)
  })

  test('should show rls accordingly', async () => {
    await createTable(page, tableNameRlsEnabled)

    // testing rls enabled
    await page.getByRole('button', { name: `View ${tableNameRlsEnabled}` }).click()
    await expect(page.getByRole('link', { name: 'Add RLS policy' })).toBeVisible()

    // testing rls disabled
    const s2 = getSelectors(tableNameRlsDisabled)
    await s2.newTableBtn(page).click()
    await s2.tableNameInput(page).fill(tableNameRlsDisabled)
    await s2.rlsCheckbox(page).click()
    await s2.rlsConfirmBtn(page).click()
    await s2.saveBtn(page).click()

    await expect(
      page.getByText(`Table ${tableNameRlsDisabled} is good to go!`),
      'Success toast should be visible after Rls disabled table is created.'
    ).toBeVisible({
      timeout: 50000,
    })

    await page.getByRole('button', { name: `View ${tableNameRlsDisabled}` }).click()
    await expect(page.getByRole('button', { name: 'RLS disabled' })).toBeVisible()

    await deleteTable(page, tableNameRlsEnabled)
    await deleteTable(page, tableNameRlsDisabled)
  })

  test('add enums and show enums on table', async ({ ref }) => {
    const ENUM_NAME = 'test_enum'
    const ENUM_COLUMN_NAME = 'test_column'

    // clear local storage, as it might result in some flakiness
    await page.evaluate((ref) => {
      localStorage.removeItem('dashboard-history-default')
      localStorage.removeItem(`dashboard-history-${ref}`)
    }, ref)
    await page.goto(toUrl(`/project/${ref}/database/types?schema=public`))

    // delete enum if it exists
    await deleteEnum(page, ENUM_NAME, ref)

    // create a new enum
    await page.getByRole('button', { name: 'Create type' }).click()
    await page.getByRole('textbox', { name: 'Name' }).fill(ENUM_NAME)
    await page.locator('input[name="values.0.value"]').fill('value1')
    await page.getByRole('button', { name: 'Add value' }).click()
    await page.locator('input[name="values.1.value"]').fill('value2')
    await page.getByRole('button', { name: 'Create type' }).click()

    // Wait for enum response to be completed
    await page.waitForResponse(
      (response) =>
        response.url().includes(`pg-meta/${ref}/types`) ||
        response.url().includes('pg-meta/default/types')
    )

    // verify enum is created
    await expect(page.getByRole('cell', { name: ENUM_NAME, exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'value1, value2', exact: true })).toBeVisible()

    // create a new table with new column for enums
    await page.goto(toUrl(`/project/${ref}/editor`))

    const s = getSelectors(tableNameEnum)
    await s.newTableBtn(page).click()
    await s.tableNameInput(page).fill(tableNameEnum)
    await s.createdAtExtraOptions(page).click()
    await page.getByText('Is Nullable').click()
    await s.createdAtExtraOptions(page).click()
    await s.addColumnBtn(page).click()
    await s.columnNameInput(page).fill(ENUM_COLUMN_NAME)
    await page.getByRole('combobox').filter({ hasText: 'Choose a column type...' }).click()
    await page.getByPlaceholder('Search types...').fill(ENUM_NAME)
    await page.getByRole('option', { name: ENUM_NAME }).click()
    await s.saveBtn(page).click()

    await expect(
      page.getByText(`Table ${tableNameEnum} is good to go!`),
      'Success toast should be visible after table creation'
    ).toBeVisible({
      timeout: 50000,
    })

    // Wait for the grid to be visible and data to be loaded
    await expect(s.grid(page), 'Grid should be visible after inserting data').toBeVisible()
    await expect(page.getByRole('columnheader', { name: ENUM_NAME })).toBeVisible()

    // insert row with enum value
    await s.insertBtn(page).click()
    await s.insertRow(page).click()
    await page.getByRole('combobox').selectOption('value1')
    await s.actionBarSaveRow(page).click()
    await expect(page.getByRole('gridcell', { name: 'value1' })).toBeVisible()

    // insert row with another enum value
    await s.insertBtn(page).click()
    await s.insertRow(page).click()
    await page.getByRole('combobox').selectOption('value2')
    await s.actionBarSaveRow(page).click()
    await expect(page.getByRole('gridcell', { name: 'value2' })).toBeVisible()

    // delete enum and enum table
    await deleteTable(page, tableNameEnum)
    await page.goto(toUrl(`/project/${ref}/database/types?schema=public`))
    await deleteEnum(page, ENUM_NAME, ref)

    // should end at the init link
    // clear local storage, as it might result in some flakiness
    await page.evaluate((ref) => {
      localStorage.removeItem('dashboard-history-default')
      localStorage.removeItem(`dashboard-history-${ref}`)
    }, ref)
    await page.goto(toUrl(`/project/${ref}/editor`))
  })

  test('csv import works properly', async () => {
    // create a new table and insert some data
    await createTable(page, tableNameCsv)
    const s = getSelectors(tableNameCsv)
    await page.getByRole('button', { name: `View ${tableNameCsv}` }).click()
    await s.insertBtn(page).click()
    await s.insertRow(page).click()
    await s.defaultValueInput(page).fill('123')
    await s.actionBarSaveRow(page).click()
    await s.insertBtn(page).click()
    await s.insertRow(page).click()
    await s.defaultValueInput(page).fill('456')
    await s.actionBarSaveRow(page).click()
    await s.insertBtn(page).click()
    await s.insertRow(page).click()
    await s.defaultValueInput(page).fill('789')
    await s.actionBarSaveRow(page).click()

    // download csv
    const tableBtn = await page.getByRole('button', { name: 'View pw-test-csv' })
    await tableBtn.getByRole('button').last().click()
    await page.getByRole('menuitem', { name: 'Export data' }).click()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('menuitem', { name: 'Export table as CSV' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.csv')
    const downloadPath = await download.path()

    // verify file contents
    const csvContent = fs.readFileSync(downloadPath, 'utf-8').replace(/\r?\n/g, '\n')
    const rows = csvContent.trim().split('\n')
    const defaultColumnValues = rows.map((row) => {
      const columns = row.split(',')
      return columns[2].trim()
    })
    const expectedDefaultColumnValues = ['defaultValueColumn', '123', '456', '789']
    defaultColumnValues.forEach((expectedValue) => {
      expect(expectedDefaultColumnValues).toContain(expectedValue)
    })

    // remove the downloaded file + clean up tables
    fs.unlinkSync(downloadPath)
    await deleteTable(page, tableNameCsv)
  })
})
