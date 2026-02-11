import { expect, Page } from '@playwright/test'
import { createTable, dropTable, query } from '../utils/db/index.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { createApiResponseWaiter, waitForTableToLoad } from '../utils/wait-for-response.js'

const FILTER_BAR_KEY = 'supabase-ui-table-filter-bar'
const tableNamePrefix = 'pw_filter_bar'

const enableFilterBar = async (page: Page) => {
  await page.evaluate((key) => {
    localStorage.setItem(key, 'true')
  }, FILTER_BAR_KEY)
}

const getFilterBarInput = (page: Page) => {
  return page.getByTestId('filter-bar-freeform-input')
}

const navigateToTable = async (page: Page, ref: string, tableName: string) => {
  const gridWaiter = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-rows-')
  await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
  await page.waitForURL(/\/editor\/\d+\?schema=public$/)
  await gridWaiter
}

const selectColumnFilter = async (page: Page, columnName: string) => {
  const freeformInput = getFilterBarInput(page)
  await freeformInput.click()
  await freeformInput.fill(columnName)
  await expect(page.getByTestId(`filter-menu-item-${columnName}`)).toBeVisible()
  await page.keyboard.press('Enter')
  // After selecting column, operator input should be focused
  await expect(page.getByTestId(`filter-operator-${columnName}`)).toBeFocused()
}

const selectOperator = async (page: Page, columnName: string, operator: string) => {
  await expect(page.getByTestId(`filter-menu-item-${operator}`)).toBeVisible()
  await page.keyboard.press('Enter')
  // After selecting operator, value input should be focused
  await expect(page.getByTestId(`filter-value-${columnName}`)).toBeFocused()
}

const addFilter = async (
  page: Page,
  ref: string,
  columnName: string,
  operator: string,
  value: string
) => {
  await selectColumnFilter(page, columnName)
  await selectOperator(page, columnName, operator)
  // Type value and press Enter — this completes the filter and triggers a grid refetch
  const rowsWaiter = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-rows-')
  const valueInput = page.getByTestId(`filter-value-${columnName}`)
  await valueInput.fill(value)
  await page.keyboard.press('Enter')
  await rowsWaiter
}

test.describe('Filter Bar', () => {
  test.beforeEach(async ({ page, ref }) => {
    const loadPromise = waitForTableToLoad(page, ref)
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await loadPromise
    await enableFilterBar(page)
    await page.reload({ waitUntil: 'networkidle' })
  })

  // Group 1: Basic Filter Operations

  test('selecting a column creates a filter condition', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_col_sel`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await selectColumnFilter(page, columnName)

      await expect(page.getByTestId(`filter-condition-${columnName}`)).toBeVisible()
      const operatorInput = page.getByTestId(`filter-operator-${columnName}`)
      await expect(operatorInput).toBeFocused()
    } finally {
      await dropTable(tableName)
    }
  })

  test('selecting operator from dropdown focuses value input', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_op_sel`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await selectColumnFilter(page, columnName)

      // Press Enter to select the first operator
      await page.keyboard.press('Enter')

      const valueInput = page.getByTestId(`filter-value-${columnName}`)
      await expect(valueInput).toBeFocused()
    } finally {
      await dropTable(tableName)
    }
  })

  test('entering value filters the grid', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_val_filt`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, columnName, '=', 'Alice')

      await expect(page.getByRole('gridcell', { name: 'Alice' })).toBeVisible()
      await expect(page.getByRole('gridcell', { name: 'Bob' })).not.toBeVisible()
      await expect(page.getByRole('gridcell', { name: 'Charlie' })).not.toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  test('removing filter via X button restores all data', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_remove_x`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }, { name: 'Bob' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, columnName, '=', 'Alice')
      await expect(page.getByRole('gridcell', { name: 'Bob' })).not.toBeVisible()

      await page.getByTestId(`filter-remove-${columnName}`).click()

      await expect(page.getByTestId(`filter-condition-${columnName}`)).not.toBeVisible()
      await expect(page.getByRole('gridcell', { name: 'Alice' })).toBeVisible()
      await expect(page.getByRole('gridcell', { name: 'Bob' })).toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  test('multiple filters can be added', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_multi`

    await query(
      `CREATE TABLE IF NOT EXISTS ${tableName} (
        id bigint generated by default as identity primary key,
        first_name text,
        last_name text
      )`
    )
    await query(
      `INSERT INTO ${tableName} (first_name, last_name) VALUES ('Alice', 'Smith'), ('Bob', 'Smith'), ('Alice', 'Jones')`
    )

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, 'first_name', '=', 'Alice')
      await addFilter(page, ref, 'last_name', '=', 'Smith')

      await expect(page.getByTestId('filter-condition-first_name')).toBeVisible()
      await expect(page.getByTestId('filter-condition-last_name')).toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  // Group 2: Keyboard Navigation - Group Freeform Input

  test('Enter selects column from dropdown', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_enter_col`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      const freeformInput = getFilterBarInput(page)
      await freeformInput.click()
      await freeformInput.fill(columnName)
      await expect(page.getByTestId(`filter-menu-item-${columnName}`)).toBeVisible()

      await page.keyboard.press('Enter')

      await expect(page.getByTestId(`filter-condition-${columnName}`)).toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  test('Tab selects column from dropdown', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_tab_col`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      const freeformInput = getFilterBarInput(page)
      await freeformInput.click()
      await freeformInput.fill(columnName)
      await expect(page.getByTestId(`filter-menu-item-${columnName}`)).toBeVisible()

      await page.keyboard.press('Tab')

      await expect(page.getByTestId(`filter-condition-${columnName}`)).toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  test('ArrowDown/ArrowUp navigates dropdown items', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_arrow_nav`

    await query(
      `CREATE TABLE IF NOT EXISTS ${tableName} (
        id bigint generated by default as identity primary key,
        alpha text,
        beta text,
        gamma text
      )`
    )
    await query(`INSERT INTO ${tableName} (alpha, beta, gamma) VALUES ('a', 'b', 'g')`)

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      const freeformInput = getFilterBarInput(page)
      await freeformInput.click()

      // Arrow down twice to reach the 3rd item (index 2), skipping 'id' at index 0
      // Items should be: id, alpha, beta, gamma
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')

      // The 3rd item (index 2) should be highlighted — press Enter to select it
      await page.keyboard.press('Enter')

      // Verify the correct column was selected (beta, the 3rd item after id and alpha)
      await expect(page.getByTestId('filter-condition-beta')).toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  test('Backspace on empty input highlights last filter', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_bksp_hl`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, columnName, '=', 'Alice')

      const freeformInput = getFilterBarInput(page)
      await freeformInput.click()
      await page.keyboard.press('Backspace')

      await expect(
        page.locator(`[data-testid="filter-condition-${columnName}"][data-highlighted="true"]`)
      ).toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  test('Backspace again deletes highlighted filter', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_bksp_del`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, columnName, '=', 'Alice')

      const freeformInput = getFilterBarInput(page)
      await freeformInput.click()
      // First backspace highlights
      await page.keyboard.press('Backspace')
      await expect(
        page.locator(`[data-testid="filter-condition-${columnName}"][data-highlighted="true"]`)
      ).toBeVisible()

      // Second backspace deletes
      await page.keyboard.press('Backspace')

      await expect(page.getByTestId(`filter-condition-${columnName}`)).not.toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  test('ArrowLeft highlights previous condition', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_arrowl_hl`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, columnName, '=', 'Alice')

      const freeformInput = getFilterBarInput(page)
      await freeformInput.click()
      await page.keyboard.press('ArrowLeft')

      await expect(
        page.locator(`[data-testid="filter-condition-${columnName}"][data-highlighted="true"]`)
      ).toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  test('ArrowRight clears highlight at end', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_arrowr_cl`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, columnName, '=', 'Alice')

      const freeformInput = getFilterBarInput(page)
      await freeformInput.click()
      // Highlight with ArrowLeft
      await page.keyboard.press('ArrowLeft')
      await expect(
        page.locator(`[data-testid="filter-condition-${columnName}"][data-highlighted="true"]`)
      ).toBeVisible()

      // ArrowRight clears highlight (since this is the last condition)
      await page.keyboard.press('ArrowRight')
      await expect(
        page.locator(`[data-testid="filter-condition-${columnName}"][data-highlighted="true"]`)
      ).not.toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  test('Escape clears highlight', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_esc_cl`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, columnName, '=', 'Alice')

      const freeformInput = getFilterBarInput(page)
      await freeformInput.click()
      await page.keyboard.press('ArrowLeft')
      await expect(
        page.locator(`[data-testid="filter-condition-${columnName}"][data-highlighted="true"]`)
      ).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(
        page.locator(`[data-testid="filter-condition-${columnName}"][data-highlighted="true"]`)
      ).not.toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  test('Enter on highlighted condition focuses value input', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_enter_hl`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, columnName, '=', 'Alice')

      const freeformInput = getFilterBarInput(page)
      await freeformInput.click()
      // Highlight with Backspace on empty input
      await page.keyboard.press('Backspace')
      await expect(
        page.locator(`[data-testid="filter-condition-${columnName}"][data-highlighted="true"]`)
      ).toBeVisible()

      // Enter on highlighted focuses value
      await page.keyboard.press('Enter')
      const valueInput = page.getByTestId(`filter-value-${columnName}`)
      await expect(valueInput).toBeFocused()
    } finally {
      await dropTable(tableName)
    }
  })

  // Group 3: Keyboard Navigation - Operator Input

  test('Enter selects operator and focuses value', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_op_enter`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await selectColumnFilter(page, columnName)

      await page.keyboard.press('Enter')

      const valueInput = page.getByTestId(`filter-value-${columnName}`)
      await expect(valueInput).toBeFocused()
    } finally {
      await dropTable(tableName)
    }
  })

  test('Backspace on empty operator removes condition', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_op_bksp`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await selectColumnFilter(page, columnName)

      // Clear operator value if any, then backspace to remove condition
      const operatorInput = page.getByTestId(`filter-operator-${columnName}`)
      await operatorInput.fill('')
      await page.keyboard.press('Backspace')

      await expect(page.getByTestId(`filter-condition-${columnName}`)).not.toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  // Group 4: Keyboard Navigation - Value Input

  test('Enter on value moves focus to group freeform', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_val_enter`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, columnName, '=', 'Alice')

      // Freeform should be focused after addFilter (Enter on value moves to freeform)
      const freeformInput = getFilterBarInput(page)
      await expect(freeformInput).toBeFocused()
    } finally {
      await dropTable(tableName)
    }
  })

  test('Backspace on empty value moves to operator', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_val_bksp`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await selectColumnFilter(page, columnName)
      await selectOperator(page, columnName, '=')

      // Value is empty, press Backspace
      await page.keyboard.press('Backspace')

      const operatorInput = page.getByTestId(`filter-operator-${columnName}`)
      await expect(operatorInput).toBeFocused()
    } finally {
      await dropTable(tableName)
    }
  })

  test('ArrowLeft at position 0 moves to previous condition value', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_val_arrowl`

    await query(
      `CREATE TABLE IF NOT EXISTS ${tableName} (
        id bigint generated by default as identity primary key,
        first_name text,
        last_name text
      )`
    )
    await query(
      `INSERT INTO ${tableName} (first_name, last_name) VALUES ('Alice', 'Smith'), ('Bob', 'Jones')`
    )

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, 'first_name', '=', 'Alice')
      await addFilter(page, ref, 'last_name', '=', 'Smith')

      // Click on last_name value input
      const lastNameValue = page.getByTestId('filter-value-last_name')
      await lastNameValue.click()
      // Move cursor to position 0
      await page.keyboard.press('Home')

      await page.keyboard.press('ArrowLeft')

      // Should focus previous condition's value input
      const firstNameValue = page.getByTestId('filter-value-first_name')
      await expect(firstNameValue).toBeFocused()
    } finally {
      await dropTable(tableName)
    }
  })

  test('ArrowRight at end moves to next condition or freeform', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_val_arrowr`
    const columnName = 'name'

    await createTable(tableName, columnName, [{ name: 'Alice' }])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, columnName, '=', 'Alice')

      // Use keyboard to focus the value input: highlight condition then Enter
      const freeformInput = getFilterBarInput(page)
      await freeformInput.click()
      await page.keyboard.press('Backspace') // highlight condition
      await page.keyboard.press('Enter') // focus value input

      const valueInput = page.getByTestId(`filter-value-${columnName}`)
      await expect(valueInput).toBeFocused()
      // Move cursor to end
      await page.keyboard.press('End')

      await page.keyboard.press('ArrowRight')

      // Should focus freeform input (this is the last condition)
      await expect(freeformInput).toBeFocused()
    } finally {
      await dropTable(tableName)
    }
  })

  // Group 5: Filter Results Verification

  test('filter data verification with row count', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_data_ver`
    const columnName = 'name'

    await createTable(tableName, columnName, [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' },
    ])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      // Verify all 3 rows visible
      await expect(page.getByRole('gridcell', { name: 'Alice' })).toBeVisible()
      await expect(page.getByRole('gridcell', { name: 'Bob' })).toBeVisible()
      await expect(page.getByRole('gridcell', { name: 'Charlie' })).toBeVisible()

      await addFilter(page, ref, columnName, '=', 'Alice')

      // Only Alice visible
      await expect(page.getByRole('gridcell', { name: 'Alice' })).toBeVisible()
      await expect(page.getByRole('gridcell', { name: 'Bob' })).not.toBeVisible()
      await expect(page.getByRole('gridcell', { name: 'Charlie' })).not.toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })

  test('removing filter restores all data', async ({ page, ref }) => {
    const tableName = `${tableNamePrefix}_restore`
    const columnName = 'name'

    await createTable(tableName, columnName, [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' },
    ])

    try {
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await enableFilterBar(page)
      await page.reload()
      await waitForTableToLoad(page, ref)
      await navigateToTable(page, ref, tableName)

      await addFilter(page, ref, columnName, '=', 'Alice')

      await expect(page.getByRole('gridcell', { name: 'Bob' })).not.toBeVisible()
      await expect(page.getByRole('gridcell', { name: 'Charlie' })).not.toBeVisible()

      // Remove filter
      await page.getByTestId(`filter-remove-${columnName}`).click()

      // All data restored
      await expect(page.getByRole('gridcell', { name: 'Alice' })).toBeVisible()
      await expect(page.getByRole('gridcell', { name: 'Bob' })).toBeVisible()
      await expect(page.getByRole('gridcell', { name: 'Charlie' })).toBeVisible()
    } finally {
      await dropTable(tableName)
    }
  })
})
