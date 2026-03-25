import { expect, Page } from '@playwright/test'

import { dropTable, query } from '../utils/db/index.js'
import { dismissToastsIfAny } from '../utils/dismiss-toast.js'
import { openTableContextMenu } from '../utils/table-helpers.js'
import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { createApiResponseWaiter, waitForTableToLoad } from '../utils/wait-for-response.js'

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
 * Only present when creating or duplicating a table (not when editing).
 */
function getApiAccessSwitch(page: Page) {
  const sidePanel = page.getByTestId('table-editor-side-panel')
  const dataApiSection = sidePanel
    .locator('div')
    .filter({ hasText: 'Data API Access' })
    .filter({ has: page.getByRole('switch') })
  return dataApiSection.getByRole('switch')
}

/**
 * Locates the "Manage access" link shown when editing an existing table.
 * Links out to the API settings page.
 */
function getManageAccessLink(page: Page) {
  const sidePanel = page.getByTestId('table-editor-side-panel')
  return sidePanel.getByRole('link', { name: 'Manage access' })
}

test.describe('API Access Toggle', () => {
  test.beforeEach(async ({ page, ref }) => {
    const loadPromise = waitForTableToLoad(page, ref)
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await loadPromise
  })

  test('API access is default on for a new table', async ({ page, ref }) => {
    const tableName = `${TABLE_NAME_PREFIX}_default_on`
    await using _ = await withSetupCleanup(
      async () => {
        // Nothing
      },
      async () => {
        await dropTable(tableName)
      }
    )
    // Open new table dialog
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()

    // Fill in table name
    await page.getByTestId('table-name-input').fill(tableName)

    // Verify the toggle is checked by default
    const toggle = getApiAccessSwitch(page)
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
    await using _ = await withSetupCleanup(
      async () => {
        // Nothing
      },
      async () => {
        await dropTable(tableName)
      }
    )

    // Open new table dialog
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()

    // Fill in table name
    await page.getByTestId('table-name-input').fill(tableName)

    // Toggle API access off
    const toggle = getApiAccessSwitch(page)
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

  test('shows Manage access link when editing an existing table', async ({ page, ref }) => {
    const tableName = `${TABLE_NAME_PREFIX}_edit`
    await using _ = await withSetupCleanup(
      async () => {
        // Nothing
      },
      async () => {
        await dropTable(tableName)
      }
    )
    // Create a table first
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()
    await page.getByTestId('table-name-input').fill(tableName)

    const createPromise = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-create')
    await page.getByRole('button', { name: 'Save' }).click()
    await createPromise

    await expect(
      page.getByText(`Table ${tableName} is good to go!`),
      'Success toast should appear after table creation'
    ).toBeVisible({ timeout: 15000 })

    await dismissToastsIfAny(page)
    await page.waitForSelector('[data-testid="table-editor-side-panel"]', { state: 'detached' })
    await expect(page.getByRole('button', { name: `View ${tableName}`, exact: true })).toBeVisible()

    // Navigate back and open the edit panel
    const loadPromise = waitForTableToLoad(page, ref)
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await loadPromise

    const navigationPromise = page.waitForURL(/\/editor\/\d+\?schema=public$/)
    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await navigationPromise

    await openTableContextMenu(page, tableName)
    await page.getByRole('menuitem', { name: 'Edit table' }).click()
    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()

    // Data API Access section is visible
    await expect(
      page.getByText('Data API Access'),
      'Data API Access label should be visible in edit mode'
    ).toBeVisible()

    // In edit mode the panel shows a "Manage access" link instead of a toggle switch
    const manageAccessLink = getManageAccessLink(page)
    await expect(
      manageAccessLink,
      'Manage access link should be visible in edit mode'
    ).toBeVisible()
  })

  test('preserves API grants when editing non-privilege table properties', async ({
    page,
    ref,
  }) => {
    const tableName = `${TABLE_NAME_PREFIX}_preserve_grants`
    await using _ = await withSetupCleanup(
      async () => {
        // Nothing
      },
      async () => {
        await dropTable(tableName)
      }
    )
    // Step 1: Create a table with API access on (default — full grants)
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()
    await page.getByTestId('table-name-input').fill(tableName)

    // Verify toggle is on by default
    const toggle = getApiAccessSwitch(page)
    await expect(toggle).toBeChecked()

    let createPromise = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-create')
    await page.getByRole('button', { name: 'Save' }).click()
    await createPromise

    await expect(
      page.getByText(`Table ${tableName} is good to go!`),
      'Success toast should appear after table creation'
    ).toBeVisible({ timeout: 15000 })

    await page.waitForSelector('[data-testid="table-editor-side-panel"]', { state: 'detached' })
    await expect(page.getByRole('button', { name: `View ${tableName}`, exact: true })).toBeVisible()

    // Verify full privileges were granted
    await verifyTablePrivileges('public', tableName, {
      anon: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
      authenticated: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    })

    // Step 2: Navigate back and edit only the description
    let loadPromise = waitForTableToLoad(page, ref)
    await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
    await loadPromise

    await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
    await page.waitForURL(/\/editor\/\d+\?schema=public$/)

    await openTableContextMenu(page, tableName)
    await page.getByRole('menuitem', { name: 'Edit table' }).click()
    await expect(page.getByTestId('table-editor-side-panel')).toBeVisible()

    const descriptionInput = page
      .getByTestId('table-editor-side-panel')
      .getByPlaceholder('Optional')
    await descriptionInput.fill('Test description for grant preservation')

    const updatePromise = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=table-update')
    await page.getByRole('button', { name: 'Save' }).click()
    await updatePromise

    await expect(
      page.getByText(`Successfully updated ${tableName}!`),
      'Success toast should appear after table update'
    ).toBeVisible({ timeout: 15000 })

    await page.waitForSelector('[data-testid="table-editor-side-panel"]', { state: 'detached' })

    // Step 3: Verify the full privileges are unchanged after the description edit
    await verifyTablePrivileges('public', tableName, {
      anon: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
      authenticated: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    })
  })
})
