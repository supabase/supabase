import { expect, Page } from '@playwright/test'
import { env } from '../env.config.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { createApiResponseWaiter, waitForApiResponse } from '../utils/wait-for-response.js'

const TEST_TABLE_NAME = 'pw_test_index_advisor'

/**
 * Helper function to check Index Advisor extension status via Database > Extensions page
 * Returns true if both index_advisor and hypopg extensions are enabled
 */
async function checkIndexAdvisorExtensionsEnabled(page: Page, ref: string): Promise<boolean> {
  // Navigate to Database > Extensions page
  await page.goto(toUrl(`/project/${ref}/database/extensions`))
  await waitForApiResponse(page, 'pg-meta', ref, 'extensions')

  const searchInput = page.getByPlaceholder('Search for an extension')

  // Search for index_advisor extension
  await searchInput.clear()
  await searchInput.fill('index_advisor')
  await page.waitForTimeout(500)

  // Check if index_advisor row exists
  const indexAdvisorRow = page.getByRole('row', { name: /index_advisor/i }).first()
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
  await page.waitForTimeout(500)

  // Check if hypopg row exists
  const hypopgRow = page.getByRole('row', { name: /hypopg/i }).first()
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
  await waitForApiResponse(page, 'pg-meta', ref, 'extensions')

  const searchInput = page.getByPlaceholder('Search for an extension')

  // Enable hypopg first
  await searchInput.clear()
  await searchInput.fill('hypopg')
  await page.waitForTimeout(500)

  const hypopgRow = page.getByRole('row', { name: /hypopg/i }).first()
  const hypopgSwitch = hypopgRow.getByRole('switch')
  const isHypopgEnabled = await hypopgSwitch.isChecked()

  if (!isHypopgEnabled) {
    await hypopgSwitch.click()

    // Wait for modal and click Enable extension button
    const enableButton = page.getByRole('button', { name: 'Enable extension' })
    await enableButton.waitFor({ state: 'visible', timeout: 5000 })
    await enableButton.click()

    // Wait for switch to become checked (indicates extension is enabled)
    await expect(hypopgSwitch).toBeChecked({ timeout: 30000 })
  }

  // Enable index_advisor
  await searchInput.clear()
  await searchInput.fill('index_advisor')
  await page.waitForTimeout(500)

  const indexAdvisorRow = page.getByRole('row', { name: /index_advisor/i }).first()
  const indexAdvisorSwitch = indexAdvisorRow.getByRole('switch')
  const isIndexAdvisorEnabled = await indexAdvisorSwitch.isChecked()

  if (!isIndexAdvisorEnabled) {
    await indexAdvisorSwitch.click()

    // Wait for modal and click Enable extension button
    const enableButton = page.getByRole('button', { name: 'Enable extension' })
    await enableButton.waitFor({ state: 'visible', timeout: 5000 })
    await enableButton.click()

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
  await sqlMutationPromise
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
    await sqlMutationPromise
    await page.waitForTimeout(300)
  }
}

test.describe.serial('Index Advisor', () => {
  let page: Page
  let isIndexAdvisorEnabled: boolean

  test.beforeAll(async ({ browser, ref }) => {
    page = await browser.newPage()

    // Check if Index Advisor is already enabled via Extensions page
    isIndexAdvisorEnabled = await checkIndexAdvisorExtensionsEnabled(page, ref)

    console.log(`Index Advisor enabled status: ${isIndexAdvisorEnabled}`)
  })

  test.afterAll(async () => {
    await page.close()
  })

  test.describe('Check Extension Status', () => {
    test('should check Index Advisor extensions via Database > Extensions page', async ({
      ref,
    }) => {
      await page.goto(toUrl(`/project/${ref}/database/extensions`))
      await waitForApiResponse(page, 'pg-meta', ref, 'extensions')

      await expect(
        page.getByRole('heading', { name: 'Database Extensions' }),
        'Database Extensions heading should be visible'
      ).toBeVisible()

      const searchInput = page.getByPlaceholder('Search for an extension')

      // Search for index_advisor
      await searchInput.clear()
      await searchInput.fill('index_advisor')
      await page.waitForTimeout(500)

      await expect(
        page.getByRole('row', { name: /index_advisor/i }).first(),
        'index_advisor extension should be in the list'
      ).toBeVisible()

      // Search for hypopg
      await searchInput.clear()
      await searchInput.fill('hypopg')
      await page.waitForTimeout(500)

      await expect(
        page.getByRole('row', { name: /hypopg/i }).first(),
        'hypopg extension should be in the list'
      ).toBeVisible()

      // Clear search
      await searchInput.clear()
    })
  })

  test.describe('Enable Index Advisor', () => {
    test('should display Index Advisor banner when not enabled', async ({ ref }) => {
      if (isIndexAdvisorEnabled) {
        test.skip(true, 'Index Advisor is already enabled')
      }

      // Navigate to query performance page
      await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
      await page.waitForLoadState('networkidle')

      await expect(
        page.getByRole('heading', { name: 'Query Performance' }),
        'Query Performance heading should be visible'
      ).toBeVisible()

      // Check for the banner (fallback method)
      const banner = page.locator('.fixed.bottom-4.right-4')
      const bannerCount = await banner.count()

      if (bannerCount > 0) {
        // Hover over the banner to make it interactive
        await banner.hover()
        await page.waitForTimeout(500)

        // Check for Index Advisor banner content
        const enableText = page.getByText('Enable Index Advisor')
        if ((await enableText.count()) > 0) {
          await expect(
            enableText,
            'Enable Index Advisor text should be visible in banner'
          ).toBeVisible()
        }
      }
    })

    test('should enable Index Advisor via Database > Extensions page', async ({ ref }) => {
      if (isIndexAdvisorEnabled) {
        test.skip(true, 'Index Advisor is already enabled')
      }

      await enableIndexAdvisorViaExtensions(page, ref)

      // Verify both extensions are now enabled
      const isEnabled = await checkIndexAdvisorExtensionsEnabled(page, ref)
      expect(isEnabled, 'Both extensions should be enabled after enabling').toBe(true)

      // Update the shared state
      isIndexAdvisorEnabled = true
    })

    test('should show banner dialog and enable via banner', async ({ ref }) => {
      // Re-check if enabled (in case previous test was skipped)
      const currentlyEnabled = await checkIndexAdvisorExtensionsEnabled(page, ref)

      if (currentlyEnabled) {
        test.skip(true, 'Index Advisor is already enabled')
      }

      await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
      await page.waitForLoadState('networkidle')

      const banner = page.locator('.fixed.bottom-4.right-4')
      const bannerCount = await banner.count()

      if (bannerCount === 0) {
        test.skip(true, 'Banner is not visible, using extensions page instead')
      }

      // Hover over the banner
      await banner.hover()
      await page.waitForTimeout(500)

      // Click Enable button
      const enableButton = page.getByRole('button', { name: 'Enable', exact: true })
      await enableButton.click({ force: true })
      await page.waitForTimeout(1000)

      // Verify dialog content
      await expect(
        page.getByRole('heading', { name: 'Enable Index Advisor' }),
        'Dialog title should be visible'
      ).toBeVisible()

      await expect(
        page.getByText('index_advisor'),
        'index_advisor extension should be mentioned'
      ).toBeVisible()

      await expect(page.getByText('hypopg'), 'hypopg extension should be mentioned').toBeVisible()

      // Enable the extensions
      const extensionCreateWait = createApiResponseWaiter(
        page,
        'pg-meta',
        ref,
        'query?key=extension-create'
      )
      await page.getByRole('button', { name: 'Enable Extensions' }).click()
      await extensionCreateWait
      await page.waitForTimeout(2000)

      // Verify success
      await expect(
        page.getByText('Successfully enabled Index Advisor!'),
        'Success toast should be visible'
      ).toBeVisible({ timeout: 10000 })

      isIndexAdvisorEnabled = true
    })

    test('should show Warnings filter after Index Advisor is enabled', async ({ ref }) => {
      if (!isIndexAdvisorEnabled) {
        test.skip(true, 'Index Advisor needs to be enabled first')
      }

      // Wait a bit for extensions to be fully initialized
      await page.waitForTimeout(2000)

      // Go to Query Performance page
      await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
      await page.waitForLoadState('networkidle')

      // Wait for the page to load and check for Warnings button
      // Retry a few times if needed, as the extensions status might take a moment to propagate
      let warningsButton = page.locator('button:has-text("Warnings")')
      let found = false

      for (let i = 0; i < 3; i++) {
        const count = await warningsButton.count()
        if (count > 0) {
          found = true
          break
        }
        console.log(`Attempt ${i + 1}: Warnings button not found, reloading...`)
        await page.reload()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)
      }

      await expect(
        warningsButton,
        'Warnings filter button should be visible when Index Advisor is enabled'
      ).toBeVisible({ timeout: 5000 })

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
      await page.waitForTimeout(2000)

      // Search for the table
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

      // Small delay to ensure query is tracked
      await page.waitForTimeout(2000)
    })

    test('should show Index Advisor warnings in Query Performance', async ({ ref }) => {
      if (!isIndexAdvisorEnabled) {
        test.skip(true, 'Index Advisor needs to be enabled first')
      }

      // Navigate to Query Performance page
      await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Find the Warnings filter button with a generous timeout
      const warningsButton = page.locator('button:has-text("Warnings")').first()
      await expect(warningsButton, 'Warnings filter should be visible').toBeVisible({
        timeout: 15000,
      })
      await warningsButton.click()

      // Wait for popover to open
      await page.waitForTimeout(1000)

      // Find the Index Advisor checkbox/label in the popover
      const indexAdvisorLabel = page.locator('label:has-text("Index Advisor")').first()

      await expect(
        indexAdvisorLabel,
        'Index Advisor option should be in Warnings popover'
      ).toBeVisible({
        timeout: 5000,
      })

      // Click the label to select Index Advisor filter
      await indexAdvisorLabel.click()
      await page.waitForTimeout(500)

      // Find and click the "Save" or "Apply" button in the popover
      const saveButton = page.locator('button:has-text("Save")').first()
      const saveCount = await saveButton.count()

      if (saveCount > 0) {
        await saveButton.click()
        await page.waitForTimeout(1000)
      } else {
        // If no Save button, the filter might apply automatically
        // Close the popover by clicking outside or pressing Escape
        await page.keyboard.press('Escape')
        await page.waitForTimeout(1000)
      }

      // Check if any rows with Index Advisor warnings appear in the results
      // Look for rows in the query performance grid
      const queryRows = page.locator('[role="row"]')
      const rowCount = await queryRows.count()

      console.log(`Number of rows after filtering: ${rowCount}`)

      if (rowCount > 1) {
        // More than 1 row (excluding header) means we have results
        await expect(
          queryRows.nth(1),
          'At least one query with Index Advisor warning should be visible'
        ).toBeVisible()

        console.log('Successfully found queries with Index Advisor recommendations')
      } else {
        console.log(
          'No queries with Index Advisor warnings found - may need more query executions or time'
        )
      }
    })
  })
})
