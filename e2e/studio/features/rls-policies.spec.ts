import { expect, Page } from '@playwright/test'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { createApiResponseWaiter, waitForApiResponse } from '../utils/wait-for-response.js'

const policyTableName = 'pw_rls_policy_test_table'
const policySelectName = 'pw_test_select_policy'
const policyInsertName = 'pw_test_insert_policy'
const policyUpdateName = 'pw_test_update_policy'
const policyDeleteName = 'pw_test_delete_policy'

/**
 * Helper function to create a test table for RLS policies
 */
const createTestTable = async (page: Page, ref: string) => {
  await page.goto(toUrl(`/project/${ref}/editor`))
  await page.waitForTimeout(1000)

  // Check if table already exists
  const tableExists =
    (await page.getByRole('button', { name: `View ${policyTableName}` }).count()) > 0

  if (!tableExists) {
    await page.getByRole('button', { name: 'New table', exact: true }).click()
    await page.getByTestId('table-name-input').fill(policyTableName)
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(
      page.getByText(`Table ${policyTableName} is good to go!`),
      'Table creation confirmation should be visible'
    ).toBeVisible({ timeout: 50000 })
  }
}

/**
 * Helper function to delete the test table
 */
const deleteTestTable = async (page: Page, ref: string) => {
  await page.goto(toUrl(`/project/${ref}/editor`))
  await page.waitForTimeout(1000)

  const tableExists =
    (await page.getByRole('button', { name: `View ${policyTableName}` }).count()) > 0

  if (tableExists) {
    await page.getByLabel(`View ${policyTableName}`).nth(0).click()
    await page.getByLabel(`View ${policyTableName}`).getByRole('button').nth(1).click()
    await page.getByText('Delete table').click()
    await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).click()
    await page.getByRole('button', { name: 'Delete' }).click()

    await expect(
      page.getByText(`Successfully deleted table "${policyTableName}"`),
      'Table deletion confirmation should be visible'
    ).toBeVisible({ timeout: 50000 })
  }
}

/**
 * Helper function to navigate to policies page and wait for it to load
 */
const navigateToPoliciesPage = async (page: Page, ref: string) => {
  const wait = createApiResponseWaiter(page, 'pg-meta', ref, 'policies')
  await page.goto(toUrl(`/project/${ref}/auth/policies`))
  await wait
  await page.waitForTimeout(500)
}

/**
 * Helper function to delete a policy if it exists
 */
const deletePolicyIfExists = async (page: Page, ref: string, policyNameToDelete: string) => {
  // Look for the policy in the table
  const policyButton = page.getByRole('button', { name: policyNameToDelete })
  const policyExists = (await policyButton.count()) > 0

  if (policyExists) {
    // Click the policy row actions button
    await policyButton.locator('..').locator('..').getByRole('button').last().click()
    await page.waitForTimeout(200)

    // Click delete
    await page.getByText('Delete', { exact: true }).click()
    await page.waitForTimeout(200)

    // Confirm deletion
    await page.getByRole('button', { name: 'Delete' }).click()

    // Wait for deletion to complete
    await waitForApiResponse(page, 'pg-meta', ref, 'query?key=')

    await expect(
      page.getByText('Successfully removed policy'),
      'Policy deletion confirmation should be visible'
    ).toBeVisible({ timeout: 50000 })

    await page.waitForTimeout(500)
  }
}

test.describe.serial('RLS Policies', () => {
  let page: Page

  test.beforeAll(async ({ browser, ref }) => {
    page = await browser.newPage()

    // Create test table
    await createTestTable(page, ref)

    // Navigate to policies page
    await navigateToPoliciesPage(page, ref)
  })

  test.afterAll(async ({ ref }) => {
    // Clean up: delete test table
    await deleteTestTable(page, ref)
    await page.close()
  })

  test.describe('Policies Page', () => {
    test('should display policies page correctly', async ({ ref }) => {
      await navigateToPoliciesPage(page, ref)

      // Check page elements
      await expect(page.getByRole('heading', { name: 'Policies' })).toBeVisible()
      await expect(
        page.getByText('Manage Row Level Security policies for your tables')
      ).toBeVisible()

      // Check schema selector is present
      await expect(page.getByRole('button', { name: 'schema public' })).toBeVisible()

      // Check search/filter input is present
      await expect(page.getByPlaceholder('Filter tables and policies')).toBeVisible()

      // Check the test table is visible
      await expect(page.getByText(policyTableName)).toBeVisible()
    })

    test('should filter tables and policies by search', async ({ ref }) => {
      await navigateToPoliciesPage(page, ref)

      const searchInput = page.getByPlaceholder('Filter tables and policies')

      // Search for the test table
      await searchInput.fill(policyTableName)
      await page.waitForTimeout(500)

      // Test table should be visible
      await expect(page.getByText(policyTableName)).toBeVisible()

      // Clear search
      await searchInput.fill('')
      await page.waitForTimeout(500)
    })

    test('should switch between schemas', async ({ ref }) => {
      await navigateToPoliciesPage(page, ref)

      // Click schema selector
      await page.getByRole('button', { name: 'schema public' }).click()

      // Select auth schema
      await page.getByRole('option', { name: 'auth' }).click()
      await page.waitForTimeout(1000)

      // Should see auth schema tables
      await expect(page.getByRole('heading', { name: 'users', exact: true })).toBeVisible()

      // Switch back to public
      await page.getByRole('button', { name: 'schema auth' }).click()
      await page.getByRole('option', { name: 'public', exact: true }).click()
      await page.waitForTimeout(1000)
    })
  })

  test.describe('Create RLS Policy', () => {
    test('should create a SELECT policy successfully', async ({ ref }) => {
      await navigateToPoliciesPage(page, ref)

      // Delete policy if it exists from previous run
      await deletePolicyIfExists(page, ref, policySelectName)

      // Find the test table and click "Create policy"
      await page.getByTestId(`${policyTableName}-create-policy`).click()

      // Wait for dialog to open
      await expect(
        page.getByRole('heading', { name: 'Create a new Row Level Security policy' }),
        'Policy creation dialog should open'
      ).toBeVisible()

      // Fill in policy name
      await page.getByRole('textbox', { name: 'Policy Name' }).fill(policySelectName)

      // Verify the table is already selected (should be the table we clicked from)
      await expect(page.getByRole('button', { name: `public.${policyTableName}` })).toBeVisible()

      // SELECT should be selected by default
      await expect(page.getByRole('radio', { name: 'SELECT' })).toBeChecked()

      // Fill in USING clause - allow all access
      const editor = page.getByRole('textbox', { name: 'Editor content;Press Alt+F1' })
      await editor.fill('true')

      // Save policy
      await page.getByRole('button', { name: 'Save policy' }).click()

      // Wait for success message
      await expect(
        page.getByText('Successfully created new policy'),
        'Policy creation success message should be visible'
      ).toBeVisible({ timeout: 50000 })

      // Verify policy appears in the list
      await expect(page.getByRole('button', { name: policySelectName })).toBeVisible()

      // Verify policy details
      const policyRow = page.locator(`tr:has-text("${policySelectName}")`)
      await expect(policyRow.locator('code').filter({ hasText: /^SELECT$/ })).toBeVisible()
      await expect(policyRow.locator('code').filter({ hasText: /^public$/ })).toBeVisible()
    })

    test('should create an INSERT policy with authenticated role', async ({ ref }) => {
      await navigateToPoliciesPage(page, ref)

      // Delete policy if it exists
      await deletePolicyIfExists(page, ref, policyInsertName)

      // Open create policy dialog
      await page.getByTestId(`${policyTableName}-create-policy`).click()

      await expect(
        page.getByRole('heading', { name: 'Create a new Row Level Security policy' })
      ).toBeVisible()

      // Fill in policy name
      await page.getByRole('textbox', { name: 'Policy Name' }).fill(policyInsertName)

      // Select INSERT command
      await page.getByRole('radio', { name: 'INSERT' }).click()

      // Select target role - authenticated
      await page.getByText('Defaults to all (public) roles if none selected').click()
      await page.getByRole('option', { name: 'authenticated' }).click()

      // Close the dropdown
      await page.keyboard.press('Escape')

      // Fill in WITH CHECK clause - allow all inserts
      const editor = page.getByRole('textbox', { name: 'Editor content;Press Alt+F1' })
      await editor.fill('true')

      // Save policy
      await page.getByRole('button', { name: 'Save policy' }).click()

      // Wait for success
      await expect(page.getByText('Successfully created new policy')).toBeVisible({
        timeout: 50000,
      })

      // Verify policy appears with correct details
      await expect(page.getByRole('button', { name: policyInsertName })).toBeVisible()
      const policyRow = page.locator(`tr:has-text("${policyInsertName}")`)
      await expect(policyRow.locator('code').filter({ hasText: /^INSERT$/ })).toBeVisible()
      await expect(policyRow.locator('code').filter({ hasText: /^authenticated$/ })).toBeVisible()
    })

    test('should create an UPDATE policy with custom condition', async ({ ref }) => {
      await navigateToPoliciesPage(page, ref)

      // Delete policy if it exists
      await deletePolicyIfExists(page, ref, policyUpdateName)

      // Open create policy dialog
      await page.getByTestId(`${policyTableName}-create-policy`).click()

      await expect(
        page.getByRole('heading', { name: 'Create a new Row Level Security policy' })
      ).toBeVisible()

      // Fill in policy name
      await page.getByRole('textbox', { name: 'Policy Name' }).fill(policyUpdateName)

      // Select UPDATE command
      await page.getByRole('radio', { name: 'UPDATE' }).click()

      // Select authenticated role
      await page.getByText('Defaults to all (public) roles if none selected').click()
      await page.getByRole('option', { name: 'authenticated' }).click()
      await page.keyboard.press('Escape')

      // Fill in USING clause (UPDATE has both USING and WITH CHECK editors, so use first)
      const editor = page.getByRole('textbox', { name: 'Editor content;Press Alt+F1' }).first()
      await editor.fill('true')

      // Save policy
      await page.getByRole('button', { name: 'Save policy' }).click()

      // Wait for success
      await expect(page.getByText('Successfully created new policy')).toBeVisible({
        timeout: 50000,
      })

      // Verify policy appears
      await expect(page.getByRole('button', { name: policyUpdateName })).toBeVisible()
      const policyRow = page.locator(`tr:has-text("${policyUpdateName}")`)
      await expect(policyRow.locator('code').filter({ hasText: /^UPDATE$/ })).toBeVisible()
    })

    test('should create a DELETE policy', async ({ ref }) => {
      await navigateToPoliciesPage(page, ref)

      // Delete policy if it exists
      await deletePolicyIfExists(page, ref, policyDeleteName)

      // Open create policy dialog
      await page.getByTestId(`${policyTableName}-create-policy`).click()

      await expect(
        page.getByRole('heading', { name: 'Create a new Row Level Security policy' })
      ).toBeVisible()

      // Fill in policy name
      await page.getByRole('textbox', { name: 'Policy Name' }).fill(policyDeleteName)

      // Select DELETE command
      await page.getByRole('radio', { name: 'DELETE' }).click()

      // Select authenticated role
      await page.getByText('Defaults to all (public) roles if none selected').click()
      await page.getByRole('option', { name: 'authenticated' }).click()
      await page.keyboard.press('Escape')

      // Fill in USING clause
      const editor = page.getByRole('textbox', { name: 'Editor content;Press Alt+F1' })
      await editor.fill('true')

      // Save policy
      await page.getByRole('button', { name: 'Save policy' }).click()

      // Wait for success
      await expect(page.getByText('Successfully created new policy')).toBeVisible({
        timeout: 50000,
      })

      // Verify policy appears
      await expect(page.getByRole('button', { name: policyDeleteName })).toBeVisible()
      const policyRow = page.locator(`tr:has-text("${policyDeleteName}")`)
      await expect(policyRow.locator('code').filter({ hasText: /^DELETE$/ })).toBeVisible()
    })

    test('should cancel policy creation', async ({ ref }) => {
      await navigateToPoliciesPage(page, ref)

      // Open create policy dialog
      await page.getByTestId(`${policyTableName}-create-policy`).click()

      await expect(
        page.getByRole('heading', { name: 'Create a new Row Level Security policy' })
      ).toBeVisible()

      // Fill in some data
      await page.getByRole('textbox', { name: 'Policy Name' }).fill('policy_to_cancel')

      // Click cancel
      await page.getByRole('button', { name: 'Cancel' }).click()

      // Dialog should close
      await expect(
        page.getByRole('heading', { name: 'Create a new Row Level Security policy' })
      ).not.toBeVisible()
    })
  })
})
