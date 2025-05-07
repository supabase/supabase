import { expect, Page } from '@playwright/test'
import { test } from '../utils/test'

const getSelectors = (tableName: string) => ({
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
  deleteTableToast: (page) =>
    page.getByText(`Successfully deleted table "${tableName}"`, { exact: true }),
})

const createTestTable = async (page: Page, tableName: string) => {
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
}

const deleteTestTable = async (page: Page, tableName: string) => {
  const s = getSelectors(tableName)

  await s.viewTableLabel(page).click()
  await s.viewTableLabel(page).getByRole('button').nth(1).click()
  await s.deleteTableBtn(page).click()
  await s.confirmDeleteBtn(page).click()
  await expect(s.deleteTableToast(page)).toBeVisible()
}

// Clean up all tables with prefix playwright-test-*
const cleanupTables = async (page: Page) => {
  let tablesToDelete = []
  const tableRows = page.getByTestId('tables-list').locator('a')
  const count = await tableRows.count()
  for (let i = 0; i < count; ++i) {
    const tableName = await tableRows.nth(i).textContent()
    if (tableName.includes('playwright-test-')) {
      tablesToDelete.push(tableName)
    }
  }

  for (const table of tablesToDelete.reverse()) {
    await deleteTestTable(page, table)
  }
}

test.describe('Table Editor', () => {
  let page: Page

  test.beforeEach(async ({ browser, ref }) => {
    page = await browser.newPage()
    await page.goto(`/project/${ref}`)
    await page.locator('a', { hasText: 'Table Editor' }).click({ timeout: 10000 })
    // Click anywhere on the screen to close the sidebar
    await page.click('body')
  })

  test.afterEach(async () => {
    await cleanupTables(page)
    await page.close()
  })

  test('should create a new table', async () => {
    const tableName = `playwright-test-creation`
    await createTestTable(page, tableName)

    // Verify table exists
    await expect(page.getByRole('button', { name: tableName })).toBeVisible()

    // Cleanup
    await deleteTestTable(page, tableName)
  })

  test('should view table definition', async () => {
    const tableName = 'playwright-test-definition-1'
    await createTestTable(page, tableName)

    const s = getSelectors(tableName)
    await page.evaluate(() => document.querySelector('.ReactQueryDevtools')?.remove())
    await s.definitionTab(page).click()
    await expect(s.viewLines(page)).toContainText(
      `CREATE  TABLE public.${tableName} (  id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,  created_at timestamp with time zone NULL DEFAULT now(),  "defaultValueColumn" smallint NULL DEFAULT '2'::smallint,  CONSTRAINT ${tableName}_pkey PRIMARY KEY (id)) TABLESPACE pg_default;`
    )

    // Cleanup
    await deleteTestTable(page, tableName)
  })

  test('should insert new rows', async () => {
    const tableName = `playwright-test-insert-rows`
    await createTestTable(page, tableName)

    const s = getSelectors(tableName)
    await page.getByRole('button', { name: tableName }).click()
    await s.insertRowBtn(page).click()
    await s.insertModal(page).click()
    await s.defaultValueInput(page).fill('100')
    await s.actionBarSaveRow(page).click()

    await page.getByRole('button', { name: tableName }).click()
    await s.insertRowBtn(page).click()
    await s.insertModal(page).click()
    await s.actionBarSaveRow(page).click()

    // Cleanup
    await deleteTestTable(page, tableName)
  })

  test('should sort rows by column', async ({ apiUrl, ref }) => {
    const tableName = `playwright-test-sorting`
    await createTestTable(page, tableName)

    const s = getSelectors(tableName)

    // Insert test data
    await page.getByRole('button', { name: tableName }).click()
    await s.insertRowBtn(page).click()
    await s.insertModal(page).click()
    await s.defaultValueInput(page).fill('100')
    await s.actionBarSaveRow(page).click()

    await page.getByRole('button', { name: tableName }).click()
    await s.insertRowBtn(page).click()
    await s.insertModal(page).click()
    await s.defaultValueInput(page).fill('2')
    await s.actionBarSaveRow(page).click()

    await page.waitForResponse((response) => response.url().includes(`pg-meta/${ref}/query`))
    await expect(s.grid(page)).toContainText('2')
    await expect(s.grid(page)).toContainText('100')
    await expect(s.row(page)).toHaveCount(3)

    await s.sortBtn(page).click()
    await s.pickSortColumnBtn(page).click()
    await s.sortColumnOption(page).click()
    await s.applySortingBtn(page).click()
    await page.keyboard.down('Escape')

    await expect(s.row(page).nth(1)).toContainText('2')
    await expect(s.row(page).nth(2)).toContainText('100')

    await s.sortedByRuleBtn(page).click()
    await page.getByRole('dialog').getByRole('button').nth(1).click()

    // Cleanup
    await deleteTestTable(page, tableName)
  })

  test('should filter rows', async () => {
    const tableName = `playwright-test-filter-rows`
    await createTestTable(page, tableName)

    const s = getSelectors(tableName)

    // Insert test data
    await page.getByRole('button', { name: tableName }).click()
    await s.insertRowBtn(page).click()
    await s.insertModal(page).click()
    await s.defaultValueInput(page).fill('100')
    await s.actionBarSaveRow(page).click()

    await page.getByRole('button', { name: tableName }).click()
    await s.insertRowBtn(page).click()
    await s.insertModal(page).click()
    await s.defaultValueInput(page).fill('2')
    await s.actionBarSaveRow(page).click()

    await s.filterBtn(page).click()
    await s.addFilterBtn(page).click()
    await s.columnPickerBtn(page).click()
    await s.filterColumnOption(page).click()
    await s.filterInput(page).fill('2')
    await s.applyFilterBtn(page).click()
    await page.keyboard.down('Escape')

    await expect(s.grid(page)).toContainText('2')
    await expect(s.grid(page)).not.toContainText('100')

    // Cleanup
    await deleteTestTable(page, tableName)
  })

  test('should check the auth schema, search for users table and find it', async ({ ref }) => {
    await page.getByTestId('schema-selector').click()
    await page.getByRole('option', { name: 'auth' }).click()

    // Wait for the tables list to be visible
    await page.getByTestId('tables-list').waitFor({ state: 'visible' })

    // search for users
    await page.getByRole('textbox', { name: 'Search tables...' }).fill('users')

    // Try to find the users table directly
    const usersTable = page.getByRole('button', { name: 'View users' })
    await expect(usersTable).toBeVisible({ timeout: 5000 })
  })

  test('should show rls disabled accordingly', async () => {
    const tableNameRlsEnabled = `playwright-test-rls-enabled`
    const tableNameRlsDisabled = `playwright-test-rls-disabled`
    await createTestTable(page, tableNameRlsEnabled)

    // testing rls enabled
    await page.getByRole('button', { name: tableNameRlsEnabled }).click()
    await expect(page.getByRole('link', { name: 'Add RLS policy' })).toBeVisible()

    // testing rls disabled
    const s2 = getSelectors(tableNameRlsDisabled)
    await s2.newTableBtn(page).click()
    await s2.tableNameInput(page).fill(tableNameRlsDisabled)
    await s2.rlsCheckbox(page).click()
    await s2.rlsConfirmBtn(page).click()
    await s2.saveBtn(page).click()

    await page.getByRole('button', { name: tableNameRlsDisabled }).click()
    await expect(page.getByRole('button', { name: 'RLS disabled' })).toBeVisible()

    // cleanup
    await deleteTestTable(page, tableNameRlsEnabled)
    await deleteTestTable(page, tableNameRlsDisabled)
  })
})
