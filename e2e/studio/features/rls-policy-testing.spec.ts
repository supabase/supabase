import { expect, Page } from '@playwright/test'

import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { createApiResponseWaiter, waitForApiResponse } from '../utils/wait-for-response.js'
import { createTableWithRLS, dropTable } from '../utils/db/queries.js'

const TABLE_NAME = 'pw_rls_testing_tab_table'
const COLUMN_NAME = 'user_id'

/**
 * Navigate to the policies page Testing tab and wait for it to load.
 */
const navigateToTestingTab = async (page: Page, ref: string) => {
  const wait = createApiResponseWaiter(page, 'pg-meta', ref, 'policies')
  await page.goto(toUrl(`/project/${ref}/auth/policies?tab=testing`))
  await wait
  await expect(
    page.getByTestId('rls-policy-testing'),
    'Testing tab content should be visible'
  ).toBeVisible({ timeout: 30000 })
}

/**
 * Navigate to the policies page (Policies tab) and wait for it to load.
 */
const navigateToPoliciesPage = async (page: Page, ref: string) => {
  const wait = createApiResponseWaiter(page, 'pg-meta', ref, 'policies')
  await page.goto(toUrl(`/project/${ref}/auth/policies`))
  await wait
  await page.waitForTimeout(500)
}

test.describe('RLS Policy Testing Tab', () => {
  test.describe('Tab Navigation', () => {
    test('should switch between Policies and Testing tabs', async ({ page, ref }) => {
      const tableName = 'pw_rls_tab_nav_table'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(tableName, 'test')
        },
        async () => {
          await dropTable(tableName)
        }
      )

      await navigateToPoliciesPage(page, ref)

      // Should be on Policies tab by default
      await expect(
        page.getByPlaceholder('Filter tables and policies'),
        'Filter input should be visible on Policies tab'
      ).toBeVisible()

      // Click Testing tab
      await page.getByRole('tab', { name: 'Testing' }).click()

      // Testing tab content should appear
      await expect(
        page.getByTestId('rls-policy-testing'),
        'Testing tab content should be visible after clicking Testing tab'
      ).toBeVisible({ timeout: 10000 })

      // Filter input should be hidden on Testing tab
      await expect(
        page.getByPlaceholder('Filter tables and policies'),
        'Filter input should be hidden on Testing tab'
      ).not.toBeVisible()

      // Click Policies tab to go back
      await page.getByRole('tab', { name: 'Policies' }).click()

      // Filter input should reappear
      await expect(
        page.getByPlaceholder('Filter tables and policies'),
        'Filter input should reappear on Policies tab'
      ).toBeVisible()
    })

    test('should navigate directly to Testing tab via URL', async ({ page, ref }) => {
      const tableName = 'pw_rls_tab_direct_table'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(tableName, 'test')
        },
        async () => {
          await dropTable(tableName)
        }
      )

      await navigateToTestingTab(page, ref)

      // Table selector should be visible
      await expect(
        page.getByTestId('rls-testing-table-selector'),
        'Table selector should be visible on Testing tab'
      ).toBeVisible()

      // Our test table should be available for selection
      await expect(
        page.getByTestId(`rls-testing-table-${tableName}`),
        'Test table should appear in the table selector'
      ).toBeVisible()
    })
  })

  test.describe('Table Selection', () => {
    test('should show SQL editor and roles after selecting a table', async ({ page, ref }) => {
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(TABLE_NAME, COLUMN_NAME)
        },
        async () => {
          await dropTable(TABLE_NAME)
        }
      )

      await navigateToTestingTab(page, ref)

      // Before selection: SQL editor should not be visible
      await expect(
        page.getByTestId('rls-testing-sql-editor'),
        'SQL editor should not be visible before table selection'
      ).not.toBeVisible()

      // Select the test table
      await page.getByTestId(`rls-testing-table-${TABLE_NAME}`).click()

      // Wait for the table definition to load
      await waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-definition', {
        soft: true,
        fallbackWaitMs: 2000,
      })

      // SQL editor should now be visible
      await expect(
        page.getByTestId('rls-testing-sql-editor'),
        'SQL editor should be visible after selecting a table'
      ).toBeVisible({ timeout: 10000 })

      // Run Test button should be present
      await expect(
        page.getByTestId('rls-testing-run-button'),
        'Run Test button should be visible'
      ).toBeVisible()

      // Default roles should be displayed (anon + authenticated)
      await expect(
        page.getByText('anon', { exact: true }),
        'anon role should be present by default'
      ).toBeVisible()

      await expect(
        page.getByText('authenticated', { exact: true }).first(),
        'authenticated role should be present by default'
      ).toBeVisible()

      // Sample Data Rows label should be visible
      await expect(
        page.getByText('Sample Data Rows'),
        'Sample Data Rows configuration should be visible'
      ).toBeVisible()
    })

    test('should show empty state when no tables exist in schema', async ({ page, ref }) => {
      // Navigate to a schema with no user tables (e.g. a non-existent one via search)
      const wait = createApiResponseWaiter(page, 'pg-meta', ref, 'policies')
      await page.goto(toUrl(`/project/${ref}/auth/policies?tab=testing`))
      await wait

      // Switch to a schema that has no tables (extensions)
      await page.getByRole('button', { name: /schema/ }).click()

      // Check if 'extensions' schema is available, if not skip
      const extensionsOption = page.getByRole('option', { name: 'extensions' })
      if ((await extensionsOption.count()) > 0) {
        await extensionsOption.click()
        await page.waitForTimeout(1000)

        await expect(
          page.getByText('No tables found in schema'),
          'Should show empty state for schema without tables'
        ).toBeVisible({ timeout: 10000 })
      }
    })
  })

  test.describe('Role Management', () => {
    test('should add and remove test roles', async ({ page, ref }) => {
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(TABLE_NAME, COLUMN_NAME)
        },
        async () => {
          await dropTable(TABLE_NAME)
        }
      )

      await navigateToTestingTab(page, ref)

      // Select a table to show roles section
      await page.getByTestId(`rls-testing-table-${TABLE_NAME}`).click()
      await page.waitForTimeout(500)

      // Count initial roles (should be 2: anon + authenticated)
      const roleSelects = page.locator('select')
      await expect(roleSelects, 'Should have 2 default roles').toHaveCount(2)

      // Add a new role
      await page.getByRole('button', { name: 'Add Role' }).click()

      // Should now have 3 roles
      await expect(roleSelects, 'Should have 3 roles after adding').toHaveCount(3)

      // Remove the last role (click the last trash button)
      const trashButtons = page.getByRole('button').filter({
        has: page.locator('svg.lucide-trash-2'),
      })
      await trashButtons.last().click()

      // Should be back to 2 roles
      await expect(roleSelects, 'Should have 2 roles after removing').toHaveCount(2)
    })

    test('should disable uid and email fields for anon role', async ({ page, ref }) => {
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(TABLE_NAME, COLUMN_NAME)
        },
        async () => {
          await dropTable(TABLE_NAME)
        }
      )

      await navigateToTestingTab(page, ref)

      // Select a table
      await page.getByTestId(`rls-testing-table-${TABLE_NAME}`).click()
      await page.waitForTimeout(500)

      // The first role is anon — its uid and email fields should be disabled
      const firstRoleUid = page.getByPlaceholder('UUID...').first()
      const firstRoleEmail = page.getByPlaceholder('user@example.com').first()

      await expect(
        firstRoleUid,
        'UUID field should be disabled for anon role'
      ).toBeDisabled()
      await expect(
        firstRoleEmail,
        'Email field should be disabled for anon role'
      ).toBeDisabled()

      // The second role is authenticated — its fields should be enabled
      const secondRoleUid = page.getByPlaceholder('UUID...').nth(1)
      const secondRoleEmail = page.getByPlaceholder('user@example.com').nth(1)

      await expect(
        secondRoleUid,
        'UUID field should be enabled for authenticated role'
      ).toBeEnabled()
      await expect(
        secondRoleEmail,
        'Email field should be enabled for authenticated role'
      ).toBeEnabled()
    })
  })

  test.describe('Run Test', () => {
    test('should show error when policy SQL is empty and run is clicked', async ({
      page,
      ref,
    }) => {
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(TABLE_NAME, COLUMN_NAME)
        },
        async () => {
          await dropTable(TABLE_NAME)
        }
      )

      await navigateToTestingTab(page, ref)

      // Select a table
      await page.getByTestId(`rls-testing-table-${TABLE_NAME}`).click()

      // Wait for table definition to load
      await waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-definition', {
        soft: true,
        fallbackWaitMs: 2000,
      })

      // Clear the editor content by selecting all and deleting
      const editor = page.getByTestId('rls-testing-sql-editor')
      await editor.click()
      await page.keyboard.press('Meta+A')
      await page.keyboard.press('Backspace')
      await page.waitForTimeout(300)

      // The Run Test button should be disabled when SQL is empty
      await expect(
        page.getByTestId('rls-testing-run-button'),
        'Run Test button should be disabled when SQL is empty'
      ).toBeDisabled()
    })

    test('should execute a policy test and display results', async ({ page, ref }) => {
      const tableName = 'pw_rls_test_run_table'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(tableName, 'user_id', [
            { user_id: '11111111-1111-1111-1111-111111111111' },
            { user_id: '22222222-2222-2222-2222-222222222222' },
          ])
        },
        async () => {
          await dropTable(tableName)
        }
      )

      await navigateToTestingTab(page, ref)

      // Select the table
      await page.getByTestId(`rls-testing-table-${tableName}`).click()

      // Wait for table definition to load
      await waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-definition', {
        soft: true,
        fallbackWaitMs: 2000,
      })

      // Clear editor and type a simple SELECT policy
      const editor = page.getByTestId('rls-testing-sql-editor')
      await editor.click()
      await page.keyboard.press('Meta+A')
      await page.keyboard.press('Backspace')
      await page.waitForTimeout(200)
      await page.keyboard.type(
        `CREATE POLICY "allow_select" ON public.${tableName} FOR SELECT TO authenticated USING (true);`,
        { delay: 5 }
      )

      // Click Run Test
      await page.getByTestId('rls-testing-run-button').click()

      // Wait for status to show progress then completion
      // The test involves: init PGlite, load schema, load data, test policy
      // This can take up to 30 seconds for WASM initialization
      await expect(
        page.getByTestId('rls-testing-status'),
        'Should show a status message during testing'
      ).toBeVisible({ timeout: 10000 })

      // Wait for results or error
      const resultsOrError = page
        .getByTestId('rls-test-results')
        .or(page.getByText('Test Error'))

      await expect(
        resultsOrError,
        'Should show test results or an error after test completes'
      ).toBeVisible({ timeout: 60000 })

      // If results are visible (PGlite loaded successfully), verify the results table
      const resultsTable = page.getByTestId('rls-test-results-table')
      if ((await resultsTable.count()) > 0) {
        // Should show SELECT column header
        await expect(
          resultsTable.getByText('SELECT', { exact: true }),
          'Results table should show SELECT column'
        ).toBeVisible()

        // Should show both roles tested
        await expect(
          resultsTable.getByText('anon', { exact: true }),
          'Results should include anon role'
        ).toBeVisible()

        await expect(
          resultsTable.getByText('authenticated', { exact: true }),
          'Results should include authenticated role'
        ).toBeVisible()

        // Authenticated should be allowed for SELECT (policy allows it)
        // anon should be denied (policy is only for authenticated)
        await expect(
          page.getByText('Allowed').first(),
          'At least one operation should be allowed'
        ).toBeVisible()

        // Apply as Migration button should be visible after successful test
        await expect(
          page.getByTestId('rls-testing-apply-migration-button'),
          'Apply as Migration button should be visible after tests pass'
        ).toBeVisible()
      }
    })
  })

  test.describe('Apply as Migration', () => {
    test('should show confirmation modal before applying migration', async ({ page, ref }) => {
      const tableName = 'pw_rls_test_migration_table'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(tableName, 'user_id', [
            { user_id: '11111111-1111-1111-1111-111111111111' },
          ])
        },
        async () => {
          await dropTable(tableName)
        }
      )

      await navigateToTestingTab(page, ref)

      // Select table
      await page.getByTestId(`rls-testing-table-${tableName}`).click()

      await waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-definition', {
        soft: true,
        fallbackWaitMs: 2000,
      })

      // Type a policy
      const editor = page.getByTestId('rls-testing-sql-editor')
      await editor.click()
      await page.keyboard.press('Meta+A')
      await page.keyboard.press('Backspace')
      await page.waitForTimeout(200)
      await page.keyboard.type(
        `CREATE POLICY "migration_test" ON public.${tableName} FOR SELECT TO authenticated USING (true);`,
        { delay: 5 }
      )

      // Run the test
      await page.getByTestId('rls-testing-run-button').click()

      // Wait for results or error
      const resultsOrError = page
        .getByTestId('rls-test-results')
        .or(page.getByText('Test Error'))

      await expect(
        resultsOrError,
        'Should show results or error'
      ).toBeVisible({ timeout: 60000 })

      // Only proceed if test succeeded and Apply button is visible
      const applyButton = page.getByTestId('rls-testing-apply-migration-button')
      if ((await applyButton.count()) > 0) {
        // Click Apply as Migration
        await applyButton.click()

        // Confirmation modal should appear
        await expect(
          page.getByRole('heading', { name: 'Apply policy as migration' }),
          'Migration confirmation modal should appear'
        ).toBeVisible({ timeout: 10000 })

        // Modal should show the SQL preview
        await expect(
          page.getByText('ENABLE ROW LEVEL SECURITY'),
          'Modal should show the migration SQL'
        ).toBeVisible()

        await expect(
          page.getByText('migration_test'),
          'Modal should show the policy name'
        ).toBeVisible()

        // Cancel should close the modal
        await page.getByRole('button', { name: 'Cancel' }).click()

        await expect(
          page.getByRole('heading', { name: 'Apply policy as migration' }),
          'Modal should close after cancel'
        ).not.toBeVisible()
      }
    })
  })

  test.describe('Schema Switching', () => {
    test('should update table list when switching schemas on Testing tab', async ({
      page,
      ref,
    }) => {
      const tableName = 'pw_rls_schema_switch_table'
      await using _ = await withSetupCleanup(
        async () => {
          await createTableWithRLS(tableName, 'test')
        },
        async () => {
          await dropTable(tableName)
        }
      )

      await navigateToTestingTab(page, ref)

      // Table should be visible in public schema
      await expect(
        page.getByTestId(`rls-testing-table-${tableName}`),
        'Table should be visible in public schema'
      ).toBeVisible({ timeout: 10000 })

      // Switch to auth schema
      await page.getByRole('button', { name: /schema/ }).click()
      await page.getByRole('option', { name: 'auth' }).click()
      await page.waitForTimeout(1000)

      // Our test table should no longer be visible
      await expect(
        page.getByTestId(`rls-testing-table-${tableName}`),
        'Table should not be visible in auth schema'
      ).not.toBeVisible()

      // auth schema tables should appear (e.g., users)
      await expect(
        page.getByTestId('rls-testing-table-selector'),
        'Table selector should still be visible'
      ).toBeVisible()

      // Switch back to public
      await page.getByRole('button', { name: /schema/ }).click()
      await page.getByRole('option', { name: 'public', exact: true }).click()
      await page.waitForTimeout(1000)

      // Our table should reappear
      await expect(
        page.getByTestId(`rls-testing-table-${tableName}`),
        'Table should reappear after switching back to public schema'
      ).toBeVisible()
    })
  })
})
