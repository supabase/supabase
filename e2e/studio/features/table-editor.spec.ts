import { expect, Page } from '@playwright/test'
import { test } from '../utils/test'
import { toUrl } from '../utils/to-url'

// Helper to generate a random table name
const getRandomTableName = () => `pw-test-${Math.floor(Math.random() * 10000)}`

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
  deleteTableToast: (page) => page.getByText('Successfully deleted table "'),
})

test.describe('Table Editor', () => {
  let page: Page
  let tableName: string

  test.beforeAll(async ({ browser, ref }) => {
    test.setTimeout(60000)

    /**
     * Create a new table for the tests
     */
    page = await browser.newPage()

    await page.goto(toUrl(`/project/${ref}/editor`))

    tableName = getRandomTableName()
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
  })

  test.afterAll(async () => {
    test.setTimeout(60000)
    /**
     * Delete the table after the tests are done
     */
    const s = getSelectors(tableName)

    const exists = (await s.tableButton(page).count()) > 0
    if (!exists) return

    await s.viewTableLabel(page).click()
    await s.viewTableLabel(page).getByRole('button').nth(1).click()
    await s.deleteTableBtn(page).click()
    await s.confirmDeleteBtn(page).click()
    await expect(
      s.deleteTableToast(page),
      'Delete confirmation toast should be visible'
    ).toBeVisible()
  })

  test('should perform all table operations sequentially', async ({ ref }) => {
    const s = getSelectors(tableName)
    test.setTimeout(60000)

    // 1. View table definition
    await page.evaluate(() => document.querySelector('.ReactQueryDevtools')?.remove())
    await s.definitionTab(page).click()
    await expect(
      s.viewLines(page),
      'Table definition should contain the correct SQL'
    ).toContainText(
      `CREATE  TABLE public.${tableName} (  id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,  created_at timestamp with time zone NULL DEFAULT now(),  "defaultValueColumn" smallint NULL DEFAULT '2'::smallint,  CONSTRAINT ${tableName}_pkey PRIMARY KEY (id)) TABLESPACE pg_default;`
    )

    // 2. Insert test data
    await page.getByRole('button', { name: `View ${tableName}` }).click()
    await s.insertRowBtn(page).click()
    await s.insertModal(page).click()
    await s.defaultValueInput(page).fill('100')
    await s.actionBarSaveRow(page).click()

    await page.getByRole('button', { name: `View ${tableName}` }).click()
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
    await page.waitForResponse((response) => response.url().includes(`pg-meta/${ref}/query`))

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
  })
})
