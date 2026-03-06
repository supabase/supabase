import { expect, Page } from '@playwright/test'

import { query } from '../utils/db/index.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { createApiResponseWaiter, waitForTableToLoad } from '../utils/wait-for-response.js'
import { dismissToastsIfAny } from '../utils/dismiss-toast.js'
import { openTableContextMenu, deleteTable } from '../utils/table-helpers.js'

const TABLE_NAME_PREFIX = 'pw_api_access'

/**
 * Verifies that the table has the expected API privileges for anon and authenticated roles.
 * Uses the database utility to query privileges directly.
 */
async function verifyTablePrivileges(
  schemaName: string,
  tableName: string,
  expectedPrivileges: {
    anon: Array<string>
    authenticated: Array<string>
  }
) {
  const results = await query<{ grantee: string; privilege_type: string }>(
    `SELECT grantee, privilege_type
     FROM information_schema.role_table_grants
     WHERE table_schema = $1
       AND table_name = $2
       AND grantee IN ('anon', 'authenticated')
       AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
     ORDER BY grantee, privilege_type`,
    [schemaName, tableName]
  )

  // Group privileges by grantee
  const actualPrivileges: Record<string, Array<string>> = {
    anon: [],
    authenticated: [],
  }

  for (const row of results) {
    if (row.grantee === 'anon' || row.grantee === 'authenticated') {
      actualPrivileges[row.grantee].push(row.privilege_type)
    }
  }

  // Sort for comparison
  actualPrivileges.anon.sort()
  actualPrivileges.authenticated.sort()
  const sortedExpected = {
    anon: [...expectedPrivileges.anon].sort(),
    authenticated: [...expectedPrivileges.authenticated].sort(),
  }

  expect(actualPrivileges.anon).toEqual(sortedExpected.anon)
  expect(actualPrivileges.authenticated).toEqual(sortedExpected.authenticated)
}

/**
 * Locates the API access toggle switch for Data API Access.
 * The switch is labeled by the nearby "Data API Access" text.
 */
function getApiAccessToggle(page: Page) {
  const sidePanel = page.getByTestId('table-editor-side-panel')
  // The switch is near the "Data API Access" label - get the section first, then find the switch
  const dataApiSection = sidePanel
    .locator('div')
    .filter({ hasText: 'Data API Access' })
    .filter({ has: page.getByRole('switch') })
  return dataApiSection.getByRole('switch')
}

/**
 * Locates the settings button for granular privilege settings.
 */
function getPrivilegeSettingsButton(page: Page) {
  const sidePanel = page.getByTestId('table-editor-side-panel')
  return sidePanel.getByRole('button', { name: 'Configure API privileges' })
}

/**
 * Gets the privilege selector combobox for a specific role in the privileges popover.
 * The popover must already be open.
 */
function getRolePrivilegeSelector(page: Page, roleLabel: 'Anonymous (anon)' | 'Authenticated') {
  // The popover is a dialog with structure: paragraph (role label) followed by combobox
  // We find the paragraph with the role text, then get the adjacent combobox
  const popoverContent = page.locator('[data-radix-popper-content-wrapper]')
  // Get the paragraph containing the role label, then navigate to the sibling combobox
  return popoverContent.getByText(roleLabel, { exact: true }).locator('..').getByRole('combobox')
}

test.describe('API Access Toggle', () => {
  test.beforeEach(async ({ page, ref }) => {
    const loadPromise = waitForTableToLoad(page, ref)
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await loadPromise
  })

  test('API access is default on for a new table', async ({ page, ref }) => {
    const tableName = `${TABLE_NAME_PREFIX}_default_on`

    // Open new table dialog
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()

    // Fill in table name
    await page.getByTestId('table-name-input').fill(tableName)

    // Find and click the API access toggle to turn it off
    const toggle = getApiAccessToggle(page)
    await expect(toggle).toBeChecked()

    // Create the table
    const createTablePromise = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=table-create'
    )
    await page.getByRole('button', { name: 'Save' }).click()
    await createTablePromise

    // Wait for success toast which indicates all operations are complete
    await expect(
      page.getByText(`Table ${tableName} is good to go!`),
      'Success toast should appear after table creation'
    ).toBeVisible({ timeout: 15000 })

    // Dismiss toast to prevent it from blocking subsequent interactions
    await dismissToastsIfAny(page)

    await page.waitForSelector('[data-testid="table-editor-side-panel"]', { state: 'detached' })

    // Verify table was created
    await expect(
      page.getByRole('button', { name: `View ${tableName}`, exact: true }),
      'Table should be visible after creation'
    ).toBeVisible()

    // Verify all API access privileges were granted
    await verifyTablePrivileges('public', tableName, {
      anon: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
      authenticated: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    })
  })

  test('can toggle API access off for a new table', async ({ page, ref }) => {
    const tableName = `${TABLE_NAME_PREFIX}_toggle_off`

    // Open new table dialog
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()

    // Fill in table name
    await page.getByTestId('table-name-input').fill(tableName)

    // Find and click the API access toggle to turn it off
    const toggle = getApiAccessToggle(page)
    await expect(toggle).toBeChecked()
    await toggle.click()
    await expect(toggle, 'Toggle should be unchecked after clicking').not.toBeChecked()

    // Create the table
    const createTablePromise = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=table-create'
    )
    await page.getByRole('button', { name: 'Save' }).click()
    await createTablePromise

    // Wait for success toast which indicates all operations are complete
    await expect(
      page.getByText(`Table ${tableName} is good to go!`),
      'Success toast should appear after table creation'
    ).toBeVisible({ timeout: 15000 })

    // Dismiss toast to prevent it from blocking subsequent interactions
    await dismissToastsIfAny(page)

    await page.waitForSelector('[data-testid="table-editor-side-panel"]', { state: 'detached' })

    // Verify table was created
    await expect(
      page.getByRole('button', { name: `View ${tableName}`, exact: true }),
      'Table should be visible after creation'
    ).toBeVisible()

    // Verify no API access privileges were granted
    await verifyTablePrivileges('public', tableName, {
      anon: [],
      authenticated: [],
    })
  })

  test('shows API access toggle when editing an existing table', async ({ page, ref }) => {
    const tableName = `${TABLE_NAME_PREFIX}_edit`

    // Create a table first
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()
    await page.getByTestId('table-name-input').fill(tableName)

    const createPromise = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-create')
    await page.getByRole('button', { name: 'Save' }).click()
    await createPromise

    // Wait for success toast which indicates all operations are complete
    await expect(
      page.getByText(`Table ${tableName} is good to go!`),
      'Success toast should appear after table creation'
    ).toBeVisible({ timeout: 15000 })

    // Dismiss toast to prevent it from blocking subsequent interactions
    await dismissToastsIfAny(page)

    await page.waitForSelector('[data-testid="table-editor-side-panel"]', { state: 'detached' })

    // Verify table was created
    await expect(
      page.getByRole('button', { name: `View ${tableName}`, exact: true }),
      'Table should be visible after creation'
    ).toBeVisible()

    // Verify default full privileges were granted
    await verifyTablePrivileges('public', tableName, {
      anon: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
      authenticated: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    })

    // Navigate back to table editor
    let loadPromise = waitForTableToLoad(page, ref)
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await loadPromise

    // Click on the table to view it
    const navigationPromise = page.waitForURL(/\/editor\/\d+\?schema=public$/)
    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await navigationPromise

    // Open edit table dialog via context menu
    await openTableContextMenu(page, tableName)
    await page.getByRole('menuitem', { name: 'Edit table' }).click()

    // Verify the side panel is open
    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()

    // Verify Data API Access section is visible
    await expect(
      page.getByText('Data API Access'),
      'Data API Access label should be visible in edit mode'
    ).toBeVisible()

    // Verify the toggle is present
    const toggle = getApiAccessToggle(page)
    await expect(toggle, 'API Access toggle should be visible in edit mode').toBeVisible()
  })

  test('creates table with partial privileges and verifies correct grants', async ({
    page,
    ref,
  }) => {
    const tableName = `${TABLE_NAME_PREFIX}_partial_grants`

    // Open new table dialog
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()

    // Fill in table name
    await page.getByTestId('table-name-input').fill(tableName)

    // Open the privilege settings popover
    const settingsButton = getPrivilegeSettingsButton(page)
    await settingsButton.click()

    await expect(page.getByText('Adjust API privileges per role')).toBeVisible()

    // Modify anon privileges - leave only SELECT
    const anonSelector = getRolePrivilegeSelector(page, 'Anonymous (anon)')
    await anonSelector.click()

    // Click DELETE to toggle it off
    await page.getByRole('option', { name: 'DELETE' }).click()
    // Click UPDATE to toggle it off
    await page.getByRole('option', { name: 'UPDATE' }).click()
    await page.getByRole('option', { name: 'INSERT' }).click()

    // Close the dropdown by clicking the combobox again
    await anonSelector.click()

    // Wait for dropdown to close
    await expect(page.getByRole('option', { name: 'DELETE' })).not.toBeVisible({ timeout: 2000 })

    // Modify authenticated privileges - remove DELETE and UPDATE (leave SELECT + INSERT)
    const authSelector = getRolePrivilegeSelector(page, 'Authenticated')
    await authSelector.click()

    // Remove all except SELECT
    await page.getByRole('option', { name: 'DELETE' }).click()
    await page.getByRole('option', { name: 'UPDATE' }).click()

    // Close the dropdown by clicking the combobox again
    await authSelector.click()

    // Wait for dropdown to close
    await expect(page.getByRole('option', { name: 'DELETE' })).not.toBeVisible({ timeout: 2000 })

    // Close the popover by pressing Escape
    await page.keyboard.press('Escape')

    // Create the table
    const createTablePromise = createApiResponseWaiter(
      page,
      'pg-meta',
      ref,
      'query?key=table-create'
    )
    await page.getByRole('button', { name: 'Save' }).click()
    await createTablePromise

    // Wait for success toast which indicates all operations (including privilege updates) are complete
    await expect(
      page.getByText(`Table ${tableName} is good to go!`),
      'Success toast should appear after table creation'
    ).toBeVisible({ timeout: 15000 })

    await page.waitForSelector('[data-testid="table-editor-side-panel"]', { state: 'detached' })

    // Verify table was created
    await expect(
      page.getByRole('button', { name: `View ${tableName}`, exact: true }),
      'Table should be visible after creation'
    ).toBeVisible()

    // Verify partial grants - anon: SELECT; authenticated: SELECT, INSERT
    await verifyTablePrivileges('public', tableName, {
      anon: ['SELECT'],
      authenticated: ['SELECT', 'INSERT'],
    })
  })

  test('preserves API grants when editing non-privilege table properties', async ({
    page,
    ref,
  }) => {
    const tableName = `${TABLE_NAME_PREFIX}_preserve_grants`

    // Step 1: Create a table with partial privileges (only SELECT and INSERT for anon)
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()

    await page.getByTestId('table-name-input').fill(tableName)

    // Open privilege settings and set partial privileges
    const settingsButton = getPrivilegeSettingsButton(page)
    await settingsButton.click()
    await expect(page.getByText('Adjust API privileges per role')).toBeVisible()

    // Modify anon privileges - keep only SELECT and INSERT
    const anonSelector = getRolePrivilegeSelector(page, 'Anonymous (anon)')
    await anonSelector.click()
    await page.getByRole('option', { name: 'DELETE' }).click()
    await page.getByRole('option', { name: 'UPDATE' }).click()
    await anonSelector.click()
    await expect(page.getByRole('option', { name: 'DELETE' })).not.toBeVisible({ timeout: 2000 })

    // Keep authenticated with full privileges
    await page.keyboard.press('Escape') // Close popover

    // Create the table
    let createPromise = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-create')
    await page.getByRole('button', { name: 'Save' }).click()
    await createPromise

    // Wait for success toast which indicates all operations (including privilege updates) are complete
    await expect(
      page.getByText(`Table ${tableName} is good to go!`),
      'Success toast should appear after table creation'
    ).toBeVisible({ timeout: 15000 })

    await page.waitForSelector('[data-testid="table-editor-side-panel"]', { state: 'detached' })

    await expect(
      page.getByRole('button', { name: `View ${tableName}`, exact: true }),
      'Table should be created'
    ).toBeVisible()

    // Verify initial privileges before edit
    await verifyTablePrivileges('public', tableName, {
      anon: ['SELECT', 'INSERT'],
      authenticated: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    })

    // Navigate back to table editor
    let loadPromise = waitForTableToLoad(page, ref)
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await loadPromise

    // Step 2: Edit the table's description (without touching privileges)
    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await openTableContextMenu(page, tableName)
    await page.getByRole('menuitem', { name: 'Edit table' }).click()

    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()

    // Add a description without modifying privileges
    const descriptionInput = page
      .getByTestId('table-editor-side-panel')
      .getByPlaceholder('Optional')
    await descriptionInput.fill('Test description for grant preservation')

    // Save the changes
    const updatePromise = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-update')
    await page.getByRole('button', { name: 'Save' }).click()
    await updatePromise

    // Wait for success toast which indicates all operations are complete
    await expect(
      page.getByText(`Successfully updated ${tableName}!`),
      'Success toast should appear after table update'
    ).toBeVisible({ timeout: 15000 })

    await page.waitForSelector('[data-testid="table-editor-side-panel"]', { state: 'detached' })

    // Step 3: Verify the privileges remain unchanged after edit
    await verifyTablePrivileges('public', tableName, {
      anon: ['SELECT', 'INSERT'],
      authenticated: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    })

    // Navigate back to table editor for cleanup
    loadPromise = waitForTableToLoad(page, ref)
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await loadPromise

    // Clean up
    await deleteTable(page, ref, tableName)
  })
})
