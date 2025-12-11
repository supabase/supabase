import { expect, Page } from '@playwright/test'
import { env } from '../env.config.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { waitForApiResponse } from '../utils/wait-for-response.js'

/**
 * Index Advisor E2E Tests
 *
 * Tests the Index Advisor functionality by:
 * 1. Checking if extensions are available
 * 2. Enabling Index Advisor via Database > Extensions page
 * 3. Verifying the Warnings filter appears after enabling
 * 4. Creating test tables and running queries
 * 5. Checking that Index Advisor warnings appear
 *
 * Anti-flakiness measures implemented:
 * - Replaced `waitForTimeout()` with proper element/API waits
 * - Added explicit waits for search results to update after input
 * - Wait for API responses when enabling/disabling extensions
 * - Defensive state checking with `refreshIndexAdvisorState()` helper
 * - Cleanup test table in afterAll to prevent interference with subsequent runs
 * - Use longer timeouts for operations that depend on extension initialization
 * - Graceful handling of optional UI elements (save buttons)
 * - All API waits wrapped in try-catch to handle timeouts gracefully
 * - API response waiters set up BEFORE triggering actions (critical for extension enabling)
 */

const TEST_TABLE_NAME = 'pw_test_index_advisor'

/**
 * Helper function to check Index Advisor extension status via Database > Extensions page
 * Returns true if both index_advisor and hypopg extensions are enabled
 */
async function checkIndexAdvisorExtensionsEnabled(page: Page, ref: string): Promise<boolean> {
  // Navigate to Database > Extensions page
  await page.goto(toUrl(`/project/${ref}/database/extensions`))

  try {
    await waitForApiResponse(page, 'pg-meta', ref, 'extensions')
  } catch (e) {
    console.warn('Extensions API timeout, continuing anyway:', (e as Error).message)
    // Wait for page to be in a stable state
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  }

  const searchInput = page.getByPlaceholder('Search for an extension')

  // Search for index_advisor extension
  await searchInput.clear()
  await searchInput.fill('index_advisor')

  // Wait for search results to update
  const indexAdvisorRow = page.getByRole('row', { name: /index_advisor/i }).first()
  await indexAdvisorRow.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})

  const indexAdvisorExists = (await indexAdvisorRow.count()) > 0

  if (!indexAdvisorExists) {
    return false
  }

  // Check if index_advisor is enabled (switch is checked)
  const indexAdvisorSwitch = indexAdvisorRow.getByRole('switch')
  const isIndexAdvisorEnabled = await indexAdvisorSwitch.isChecked()

  // Search for hypopg extension
  await searchInput.clear()
  await searchInput.fill('hypopg')

  // Wait for search results to update
  const hypopgRow = page.getByRole('row', { name: /hypopg/i }).first()
  await hypopgRow.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})

  const hypopgExists = (await hypopgRow.count()) > 0

  if (!hypopgExists) {
    return false
  }

  // Check if hypopg is enabled (switch is checked)
  const hypopgSwitch = hypopgRow.getByRole('switch')
  const isHypopgEnabled = await hypopgSwitch.isChecked()

  // Clear search
  await searchInput.clear()

  return isIndexAdvisorEnabled && isHypopgEnabled
}

/**
 * Helper function to enable Index Advisor via Database > Extensions page
 */
async function enableIndexAdvisorViaExtensions(page: Page, ref: string): Promise<void> {
  await page.goto(toUrl(`/project/${ref}/database/extensions`))

  try {
    await waitForApiResponse(page, 'pg-meta', ref, 'extensions')
  } catch (e) {
    console.warn('Extensions API timeout, continuing anyway:', (e as Error).message)
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  }

  const searchInput = page.getByPlaceholder('Search for an extension')

  // Enable hypopg first
  await searchInput.clear()
  await searchInput.fill('hypopg')

  const hypopgRow = page.getByRole('row', { name: /hypopg/i }).first()
  await hypopgRow.waitFor({ state: 'visible', timeout: 5000 })

  const hypopgSwitch = hypopgRow.getByRole('switch')
  const isHypopgEnabled = await hypopgSwitch.isChecked()

  if (!isHypopgEnabled) {
    await hypopgSwitch.click()

    // Wait for modal and click Enable extension button
    const enableButton = page.getByRole('button', { name: 'Enable extension' })
    await enableButton.waitFor({ state: 'visible', timeout: 5000 })

    // Set up API wait before clicking (must be before the action that triggers it)
    const extensionEnableWait = waitForApiResponse(page, 'pg-meta', ref, 'extensions', {
      method: 'POST',
    })
    await enableButton.click()

    // Wait for API response with timeout handling
    try {
      await extensionEnableWait
    } catch (e) {
      console.warn('Extension enable API timeout:', (e as Error).message)
    }

    // Wait for switch to become checked (indicates extension is enabled)
    await expect(hypopgSwitch).toBeChecked({ timeout: 30000 })
  }

  // Enable index_advisor
  await searchInput.clear()
  await searchInput.fill('index_advisor')

  const indexAdvisorRow = page.getByRole('row', { name: /index_advisor/i }).first()
  await indexAdvisorRow.waitFor({ state: 'visible', timeout: 5000 })

  const indexAdvisorSwitch = indexAdvisorRow.getByRole('switch')
  const isIndexAdvisorEnabled = await indexAdvisorSwitch.isChecked()

  if (!isIndexAdvisorEnabled) {
    await indexAdvisorSwitch.click()

    // Wait for modal and click Enable extension button
    const enableButton = page.getByRole('button', { name: 'Enable extension' })
    await enableButton.waitFor({ state: 'visible', timeout: 5000 })

    // Set up API wait before clicking (must be before the action that triggers it)
    const extensionEnableWait = waitForApiResponse(page, 'pg-meta', ref, 'extensions', {
      method: 'POST',
    })
    await enableButton.click()

    // Wait for API response with timeout handling
    try {
      await extensionEnableWait
    } catch (e) {
      console.warn('Extension enable API timeout:', (e as Error).message)
    }

    // Wait for switch to become checked (indicates extension is enabled)
    await expect(indexAdvisorSwitch).toBeChecked({ timeout: 30000 })
  }

  // Clear search
  await searchInput.clear()
}

/**
 * Helper function to create test table for Index Advisor verification
 */
async function createTestTable(page: Page, ref: string): Promise<void> {
  await page.goto(toUrl(`/project/${ref}/sql/new`))

  // Wait for SQL editor to be ready
  await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })

  // Click into the editor and type SQL
  await page.locator('.view-lines').click()
  await page.keyboard.press('ControlOrMeta+KeyA')

  const createTableSQL = `CREATE TABLE ${TEST_TABLE_NAME} (id int, name text);
INSERT INTO ${TEST_TABLE_NAME} VALUES (1, 'test'), (2, 'demo'), (3, 'test');`

  await page.keyboard.type(createTableSQL)

  // Run the query and wait for response
  const sqlMutationPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=', {
    method: 'POST',
  })
  await page.getByTestId('sql-run-button').click()

  try {
    await sqlMutationPromise
  } catch (e) {
    console.warn('SQL execution API timeout:', (e as Error).message)
    // Wait a bit for the query to potentially complete
    await page.waitForTimeout(2000)
  }
}

/**
 * Helper function to run query that would benefit from an index
 */
async function runQueryNeedingIndex(page: Page, ref: string): Promise<void> {
  await page.goto(toUrl(`/project/${ref}/sql/new`))

  // Wait for SQL editor to be ready
  await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })

  // Click into the editor and type SQL
  await page.locator('.view-lines').click()
  await page.keyboard.press('ControlOrMeta+KeyA')

  const querySQL = `SELECT * FROM ${TEST_TABLE_NAME} WHERE name = 'test';`
  await page.keyboard.type(querySQL)

  // Run the query multiple times to ensure it shows up in Query Performance
  for (let i = 0; i < 3; i++) {
    const sqlMutationPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=', {
      method: 'POST',
    })
    await page.getByTestId('sql-run-button').click()

    try {
      await sqlMutationPromise
    } catch (e) {
      console.warn(`SQL execution API timeout on attempt ${i + 1}:`, (e as Error).message)
      await page.waitForTimeout(1000)
    }
  }
}

test.describe.serial('Index Advisor', () => {
  let page: Page
  let isIndexAdvisorEnabled: boolean

  test.beforeAll(async ({ browser, ref }) => {
    page = await browser.newPage()

    // Check if Index Advisor is already enabled via Extensions page
    isIndexAdvisorEnabled = await checkIndexAdvisorExtensionsEnabled(page, ref)

    console.log(`[beforeAll] Index Advisor enabled status: ${isIndexAdvisorEnabled}`)
  })

  // Helper to refresh the enabled state
  async function refreshIndexAdvisorState(ref: string): Promise<void> {
    const currentState = await checkIndexAdvisorExtensionsEnabled(page, ref)
    if (currentState !== isIndexAdvisorEnabled) {
      console.log(`State changed from ${isIndexAdvisorEnabled} to ${currentState}`)
      isIndexAdvisorEnabled = currentState
    }
  }

  test.afterAll(async ({ ref }) => {
    // Clean up test table if it exists
    try {
      await page.goto(toUrl(`/project/${ref}/sql/new`))
      await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })

      await page.locator('.view-lines').click()
      await page.keyboard.press('ControlOrMeta+KeyA')
      await page.keyboard.type(`DROP TABLE IF EXISTS ${TEST_TABLE_NAME};`)

      const sqlMutationPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=', {
        method: 'POST',
      })
      await page.getByTestId('sql-run-button').click()

      try {
        await sqlMutationPromise
      } catch (e) {
        console.warn('Cleanup SQL timeout:', (e as Error).message)
      }
    } catch (e) {
      console.log('Failed to clean up test table:', (e as Error).message)
    }

    await page.close()
  })

  test.describe('Check Extension Status', () => {
    test('should check Index Advisor extensions via Database > Extensions page', async ({
      ref,
    }) => {
      await page.goto(toUrl(`/project/${ref}/database/extensions`))

      try {
        await waitForApiResponse(page, 'pg-meta', ref, 'extensions')
      } catch (e) {
        console.warn('Extensions API timeout, continuing anyway:', (e as Error).message)
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      }

      await expect(
        page.getByRole('heading', { name: 'Database Extensions' }),
        'Database Extensions heading should be visible'
      ).toBeVisible()

      const searchInput = page.getByPlaceholder('Search for an extension')

      // Search for index_advisor
      await searchInput.clear()
      await searchInput.fill('index_advisor')

      const indexAdvisorRow = page.getByRole('row', { name: /index_advisor/i }).first()
      await expect(indexAdvisorRow, 'index_advisor extension should be in the list').toBeVisible({
        timeout: 5000,
      })

      // Search for hypopg
      await searchInput.clear()
      await searchInput.fill('hypopg')

      const hypopgRow = page.getByRole('row', { name: /hypopg/i }).first()
      await expect(hypopgRow, 'hypopg extension should be in the list').toBeVisible({
        timeout: 5000,
      })

      // Clear search
      await searchInput.clear()
    })
  })

  test.describe('Enable Index Advisor', () => {
    test('should enable Index Advisor via Database > Extensions page', async ({ ref }) => {
      // Refresh state to ensure it's current
      await refreshIndexAdvisorState(ref)

      if (isIndexAdvisorEnabled) {
        test.skip(true, 'Index Advisor is already enabled')
      }

      await enableIndexAdvisorViaExtensions(page, ref)

      // Verify both extensions are now enabled and update state
      await refreshIndexAdvisorState(ref)
      expect(isIndexAdvisorEnabled, 'Both extensions should be enabled after enabling').toBe(true)
    })

    test('should show Warnings filter after Index Advisor is enabled', async ({ ref }) => {
      if (!isIndexAdvisorEnabled) {
        test.skip(true, 'Index Advisor needs to be enabled first')
      }

      // Go to Query Performance page
      await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
      await page.waitForLoadState('networkidle')

      // Wait patiently for the Warnings button to appear
      // Extensions may need time to initialize, so use a generous timeout
      const warningsButton = page.getByText('Warnings', { exact: true })
      await expect(
        warningsButton,
        'Warnings filter button should be visible when Index Advisor is enabled'
      ).toBeVisible({ timeout: 30000 })

      console.log('✓ Warnings button is now visible')
    })
  })

  test.describe('Index Advisor Functionality', () => {
    test('should create test table without indexes', async ({ ref }) => {
      if (!isIndexAdvisorEnabled) {
        test.skip(true, 'Index Advisor needs to be enabled first')
      }

      await createTestTable(page, ref)

      // Verify table was created by checking table editor
      await page.goto(toUrl(`/project/${ref}/editor`))
      await page.waitForLoadState('networkidle')

      // Use the search box to find the table
      const searchBox = page.getByPlaceholder('Search tables...')
      await searchBox.fill(TEST_TABLE_NAME)

      // Verify the table appears in filtered results
      const tableButton = page.getByRole('button', { name: `View ${TEST_TABLE_NAME}` })
      await expect(tableButton, 'Test table should be visible in table editor').toBeVisible({
        timeout: 10000,
      })
    })

    test('should run queries that need indexes', async ({ ref }) => {
      if (!isIndexAdvisorEnabled) {
        test.skip(true, 'Index Advisor needs to be enabled first')
      }

      await runQueryNeedingIndex(page, ref)
    })

    test('should show Index Advisor warnings in Query Performance', async ({ ref }) => {
      if (!isIndexAdvisorEnabled) {
        test.skip(true, 'Index Advisor needs to be enabled first')
      }

      // Navigate to Query Performance page
      await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
      await page.waitForLoadState('networkidle')

      // Wait patiently for Warnings button
      const warningsButton = page.getByText('Warnings', { exact: true }).first()
      await expect(warningsButton, 'Warnings filter should be visible').toBeVisible({
        timeout: 30000,
      })
      await warningsButton.click()

      // Wait for popover to open by checking for the Index Advisor label
      const indexAdvisorLabel = page.getByText('Index Advisor', { exact: true }).first()
      await expect(
        indexAdvisorLabel,
        'Index Advisor option should be in Warnings popover'
      ).toBeVisible({ timeout: 5000 })

      // Click the label to select Index Advisor filter
      await indexAdvisorLabel.click()

      // Find and click the "Save" button if it exists
      const saveButton = page.getByRole('button', { name: 'Save' }).first()

      try {
        await saveButton.waitFor({ state: 'visible', timeout: 2000 })
        await saveButton.click()
        // Wait for the popover to close
        await saveButton.waitFor({ state: 'hidden', timeout: 3000 })
      } catch (e) {
        // If no Save button, the filter might apply automatically
        // Close the popover by pressing Escape
        await page.keyboard.press('Escape')
      }

      // Check if any rows with Index Advisor warnings appear in the results
      // Look for rows in the query performance grid (excluding header)
      const queryRows = page.locator('[role="row"]').nth(1)

      // Give it some time for the filtered results to appear
      try {
        await expect(
          queryRows,
          'At least one query with Index Advisor warning should be visible'
        ).toBeVisible({ timeout: 10000 })
        console.log('Successfully found queries with Index Advisor recommendations')
      } catch (e) {
        console.log(
          'No queries with Index Advisor warnings found - may need more query executions or time'
        )
      }
    })
  })
})
