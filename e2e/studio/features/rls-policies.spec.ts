import { expect, Page } from '@playwright/test'

import { createTableWithRLS, dropTable } from '../utils/db/queries.js'
import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { createApiResponseWaiter, waitForApiResponse } from '../utils/wait-for-response.js'

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
    await page.getByTestId(`policy-${policyNameToDelete}-actions-button`).click()
    await page.waitForTimeout(200)

    // Click delete
    await page.getByText('Delete', { exact: true }).click()
    await page.waitForTimeout(200)

    const waitForDeletion = waitForApiResponse(page, 'pg-meta', ref, 'query?key=')
    // Confirm deletion
    await page.getByRole('button', { name: 'Delete' }).click()

    // Wait for deletion to complete
    await waitForDeletion

    await expect(
      page.getByText('Successfully removed policy'),
      'Policy deletion confirmation should be visible'
    ).toBeVisible({ timeout: 50000 })

    await page.waitForTimeout(500)
  }
}

test.describe('RLS Policies', () => {
  test.describe('Policies Page', () => {
    test('should display policies page correctly', async ({ page, ref }) => {
      const policyTableName = 'pw_rls_policy_test_table'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(policyTableName, 'test')
        },
        async () => {
          await dropTable(policyTableName)
        }
      )
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

    test('should filter tables and policies by search', async ({ page, ref }) => {
      const policyTableName = 'pw_rls_policy_filter_table'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(policyTableName, 'test')
        },
        async () => {
          await dropTable(policyTableName)
        }
      )
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

    test('should switch between schemas', async ({ page, ref }) => {
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

  test.describe('Table editor RLS badge', () => {
    test('shows Unrestricted badge when RLS is disabled for public table', async ({
      page,
      ref,
    }) => {
      const policyTableName = 'pw_rls_policy_unrestricted_table'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(policyTableName, 'test')
        },
        async () => {
          await dropTable(policyTableName)
        }
      )
      // First, ensure RLS is disabled for the test table via the Policies page
      await navigateToPoliciesPage(page, ref)

      // Wait for the test table row to appear in the policies list
      await expect(
        page.getByRole('heading', { name: policyTableName, exact: true }),
        'Test table heading should be visible on policies page'
      ).toBeVisible({ timeout: 50000 })

      const toggleRlsButton = page.getByTestId(`${policyTableName}-toggle-rls`)

      // If RLS is currently enabled, the toggle button label will be "Disable RLS"
      const toggleLabel = (await toggleRlsButton.innerText()) ?? ''
      if (toggleLabel.includes('Disable RLS')) {
        await toggleRlsButton.click()

        // A confirmation modal appears when toggling RLS from the policies page
        await expect(
          page.getByRole('heading', { name: 'Disable Row Level Security' }),
          'RLS disable confirmation modal should appear'
        ).toBeVisible({ timeout: 50000 })

        // Confirm disabling RLS
        await page.getByRole('button', { name: 'Disable RLS' }).click()

        // After confirming, the toggle button text should change to "Enable RLS"
        await expect(
          toggleRlsButton,
          'Toggle should switch to "Enable RLS" after disabling RLS'
        ).toHaveText(/Enable RLS/, { timeout: 50000 })
      }

      // Navigate to the table editor for the public schema so we can see the sidebar badge
      await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
      await page.waitForTimeout(1000)

      // In the table sidebar, the test table should have an "Unrestricted" badge
      const tableRow = page.getByRole('button', { name: `View ${policyTableName}` })
      await expect(
        tableRow,
        'Test table should be visible in the table editor sidebar'
      ).toBeVisible({ timeout: 50000 })

      const unrestrictedBadge = tableRow.getByText('Unrestricted', { exact: true })
      await expect(
        unrestrictedBadge,
        'Unrestricted badge should be visible for public tables with RLS disabled'
      ).toBeVisible({ timeout: 50000 })

      // Hover the badge to verify the tooltip explains the risk
      await unrestrictedBadge.hover()
      await expect(
        page.getByText(/This table can be accessed by anyone via the Data API as RLS is disabled/i),
        'Tooltip should describe unrestricted public access when RLS is disabled'
      ).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Create RLS Policy', () => {
    test('should create a SELECT policy successfully', async ({ page, ref }) => {
      const policyTableName = 'pw_rls_policy_select_table'
      const policySelectName = 'pw_test_select_policy'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(policyTableName, 'test')
        },
        async () => {
          await dropTable(policyTableName)
        }
      )
      await navigateToPoliciesPage(page, ref)

      // Find the test table and click "Create policy"
      await page.getByTestId(`${policyTableName}-create-policy`).click()

      // Wait for dialog to open
      await expect(
        page.getByRole('heading', { name: 'Create a new Row Level Security policy' }),
        'Policy creation dialog should open'
      ).toBeVisible()

      // Hide the sidebar tools
      await page.getByText('Hide tools').click()

      // Fill in policy name
      await page.getByRole('textbox', { name: 'Policy Name' }).fill(policySelectName)

      // Verify the table is already selected (should be the table we clicked from)
      await expect(page.getByRole('button', { name: `public.${policyTableName}` })).toBeVisible()

      // SELECT should be selected by default
      await expect(page.getByRole('radio', { name: 'SELECT' })).toBeChecked()

      // Fill in USING clause - allow all access
      await page.locator('.view-lines').click()
      await page.keyboard.type('true')

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

    test('should create an INSERT policy with authenticated role', async ({ page, ref }) => {
      const policyTableName = 'pw_rls_policy_insert_table'
      const policyInsertName = 'pw_test_insert_policy'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(policyTableName, 'test')
        },
        async () => {
          await dropTable(policyTableName)
        }
      )
      await navigateToPoliciesPage(page, ref)

      // Open create policy dialog
      await page.getByTestId(`${policyTableName}-create-policy`).click()

      await expect(
        page.getByRole('heading', { name: 'Create a new Row Level Security policy' })
      ).toBeVisible()

      // Hide the sidebar tools
      await page.getByText('Hide tools').click()

      // Fill in policy name
      await page.getByRole('textbox', { name: 'Policy Name' }).fill(policyInsertName)

      // Select INSERT command
      await page.getByRole('radio', { name: 'INSERT' }).click()

      // Select target role - authenticated
      await page.getByRole('combobox', { name: 'Target Roles' }).click()
      await page.getByRole('option', { name: 'authenticated' }).click()

      // Close the dropdown
      await page.keyboard.press('Escape')

      // Fill in WITH CHECK clause - allow all inserts
      await page.locator('.view-lines').click()
      await page.keyboard.type('true')

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

    test('should create an UPDATE policy with custom condition', async ({ page, ref }) => {
      const policyTableName = 'pw_rls_policy_update_table'
      const policyUpdateName = 'pw_test_update_policy'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(policyTableName, 'test')
        },
        async () => {
          await dropTable(policyTableName)
        }
      )
      await navigateToPoliciesPage(page, ref)

      // Open create policy dialog
      await page.getByTestId(`${policyTableName}-create-policy`).click()

      await expect(
        page.getByRole('heading', { name: 'Create a new Row Level Security policy' })
      ).toBeVisible()

      // Hide the sidebar tools
      await page.getByText('Hide tools').click()

      // Fill in policy name
      await page.getByRole('textbox', { name: 'Policy Name' }).fill(policyUpdateName)

      // Select UPDATE command
      await page.getByRole('radio', { name: 'UPDATE' }).click()

      // Select authenticated role
      await page.getByRole('combobox', { name: 'Target Roles' }).click()
      await page.getByRole('option', { name: 'authenticated' }).click()
      await page.keyboard.press('Escape')

      // Fill in USING clause (UPDATE has both USING and WITH CHECK editors, so use first)
      await page.locator('.view-lines').first().click()
      await page.keyboard.type('true')

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

    test('should create a DELETE policy', async ({ page, ref }) => {
      const policyTableName = 'pw_rls_policy_delete_table'
      const policyDeleteName = 'pw_test_delete_policy'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(policyTableName, 'test')
        },
        async () => {
          await dropTable(policyTableName)
        }
      )
      await navigateToPoliciesPage(page, ref)

      // Open create policy dialog
      await page.getByTestId(`${policyTableName}-create-policy`).click()

      await expect(
        page.getByRole('heading', { name: 'Create a new Row Level Security policy' })
      ).toBeVisible()

      // Hide the sidebar tools
      await page.getByText('Hide tools').click()

      // Fill in policy name
      await page.getByRole('textbox', { name: 'Policy Name' }).fill(policyDeleteName)

      // Select DELETE command
      await page.getByRole('radio', { name: 'DELETE' }).click()

      // Select authenticated role
      await page.getByRole('combobox', { name: 'Target Roles' }).click()
      await page.getByRole('option', { name: 'authenticated' }).click()
      await page.keyboard.press('Escape')

      // Fill in USING clause
      await page.locator('.view-lines').click()
      await page.keyboard.type('true')

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

    test('should cancel policy creation', async ({ page, ref }) => {
      const policyTableName = 'pw_rls_policy_cancel_table'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(policyTableName, 'test')
        },
        async () => {
          await dropTable(policyTableName)
        }
      )
      await navigateToPoliciesPage(page, ref)

      // Open create policy dialog
      await page.getByTestId(`${policyTableName}-create-policy`).click()

      await expect(
        page.getByRole('heading', { name: 'Create a new Row Level Security policy' })
      ).toBeVisible()

      // Fill in some data
      await page.getByRole('textbox', { name: 'Policy Name' }).fill('policy_to_cancel')

      // Click cancel
      await page.getByRole('button', { name: 'Cancel', exact: true }).click()

      // Dialog should close
      await expect(
        page.getByRole('heading', { name: 'Create a new Row Level Security policy' })
      ).not.toBeVisible()
    })
  })
})
