import { expect, Page } from '@playwright/test'
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
  insertRowBtn: (page) => page.getByTestId('table-editor-insert-new-row'),
  insertModal: (page) => page.getByText('Insert a new row into'),
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

  // wait till we see the success toast
  // Text: Table tableName is good to go!

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

const deleteTables = async (page: Page, tableName: string) => {
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

test.describe('Table Editor', () => {
  let page: Page
  const testTableName = `pw-test-table-editor`
  const tableNameRlsEnabled = `pw-test-rls-enabled`
  const tableNameRlsDisabled = `pw-test-rls-disabled`

  test.beforeAll(async ({ browser, ref }) => {
    test.setTimeout(60000)

    /**
     * Create a new table for the tests
     */
    page = await browser.newPage()
    await page.goto(toUrl(`/project/${ref}/editor`))

    await page.waitForTimeout(2000)
    // delete table name if it exists
    await deleteTables(page, testTableName)
    await deleteTables(page, tableNameRlsEnabled)
    await deleteTables(page, tableNameRlsDisabled)
  })

  test.afterAll(async () => {
    test.setTimeout(60000)

    // delete all tables related to this test
    await deleteTables(page, testTableName)
    await deleteTables(page, tableNameRlsEnabled)
    await deleteTables(page, tableNameRlsDisabled)
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
    await s.insertRowBtn(page).click()
    await s.insertModal(page).click()
    await s.defaultValueInput(page).fill('100')
    await s.actionBarSaveRow(page).click()

    await page.getByRole('button', { name: `View ${testTableName}` }).click()
    await s.insertRowBtn(page).click()
    await s.insertModal(page).click()
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

    await deleteTables(page, testTableName)
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

    await deleteTables(page, tableNameRlsEnabled)
    await deleteTables(page, tableNameRlsDisabled)
  })
})
