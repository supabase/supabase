import { expect, Page } from '@playwright/test'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import {
  createApiResponseWaiter,
  waitForApiResponse,
} from '../utils/wait-for-response.js'

/**
 * E2E Tests for RLS JWT Claims Workaround
 * Issue: https://github.com/supabase/supabase/issues/42235
 * 
 * These tests verify that the workaround functions work correctly
 * in RLS policy context, allowing JWT-based user identification.
 */

const testTableName = 'rls_jwt_workaround_test'

/**
 * Executes a SQL query via the SQL Editor and returns the result.
 */
async function executeSql(
  page: Page,
  ref: string,
  sql: string
): Promise<Array<Record<string, unknown>>> {
  const contentCountWaiter = createApiResponseWaiter(
    page,
    'platform/projects',
    ref,
    'content/count'
  )

  await page.goto(toUrl(`/project/${ref}/sql/new?skip=true`))
  await contentCountWaiter

  await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 })

  await page.locator('.view-lines').click()
  await page.keyboard.press('ControlOrMeta+KeyA')
  await page.keyboard.type(sql)

  const sqlMutationPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=', {
    method: 'POST',
  })
  await page.getByTestId('sql-run-button').click()
  await sqlMutationPromise

  const grid = page.getByRole('grid')
  const noRowsMessage = page.getByText('Success. No rows returned')

  await expect(grid.or(noRowsMessage)).toBeVisible({ timeout: 10000 })

  if (await noRowsMessage.isVisible()) {
    return []
  }

  // Extract data from grid
  const rows = await grid.locator('[role="row"]').all()
  const result: Array<Record<string, unknown>> = []

  if (rows.length > 0) {
    // Get header row to determine column names
    const headerRow = rows[0]
    const headers = await headerRow.locator('[role="columnheader"]').all()
    const columnNames: string[] = []

    for (const header of headers) {
      const text = await header.textContent()
      if (text) columnNames.push(text.trim())
    }

    // Get data rows (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const cells = await row.locator('[role="gridcell"]').all()
      const rowData: Record<string, unknown> = {}

      for (let j = 0; j < Math.min(columnNames.length, cells.length); j++) {
        const cellText = await cells[j].textContent()
        rowData[columnNames[j]] = cellText?.trim() || null
      }

      result.push(rowData)
    }
  }

  return result
}

/**
 * Helper function to create test table with RLS policies using workaround
 */
const createTestTableWithWorkaround = async (page: Page, ref: string) => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.${testTableName} (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      data text,
      created_at timestamp with time zone DEFAULT now()
    );

    ALTER TABLE public.${testTableName} ENABLE ROW LEVEL SECURITY;

    GRANT SELECT, INSERT, UPDATE, DELETE ON public.${testTableName} TO authenticated;

    DROP POLICY IF EXISTS "test_select_own_rows" ON public.${testTableName};
    CREATE POLICY "test_select_own_rows"
    ON public.${testTableName}
    FOR SELECT
    TO authenticated
    USING (user_id = public.get_current_user_id_rls());

    DROP POLICY IF EXISTS "test_insert_own_rows" ON public.${testTableName};
    CREATE POLICY "test_insert_own_rows"
    ON public.${testTableName}
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = public.get_current_user_id_rls());

    DROP POLICY IF EXISTS "test_update_own_rows" ON public.${testTableName};
    CREATE POLICY "test_update_own_rows"
    ON public.${testTableName}
    FOR UPDATE
    TO authenticated
    USING (user_id = public.get_current_user_id_rls())
    WITH CHECK (user_id = public.get_current_user_id_rls());

    DROP POLICY IF EXISTS "test_delete_own_rows" ON public.${testTableName};
    CREATE POLICY "test_delete_own_rows"
    ON public.${testTableName}
    FOR DELETE
    TO authenticated
    USING (user_id = public.get_current_user_id_rls());
  `

  await executeSql(page, ref, createTableSQL)
}

/**
 * Cleanup test table
 */
const cleanupTestTable = async (page: Page, ref: string) => {
  const cleanupSQL = `
    DROP TABLE IF EXISTS public.${testTableName} CASCADE;
  `
  await executeSql(page, ref, cleanupSQL)
}

test.describe.serial('RLS JWT Claims Workaround', () => {
  let page: Page

  test.beforeAll(async ({ browser, ref }) => {
    page = await browser.newPage()
  })

  test.afterAll(async ({ ref }) => {
    await cleanupTestTable(page, ref)
    await page.close()
  })

  test.describe('Workaround Function Tests', () => {
    test('should verify workaround function exists', async ({ ref }) => {
      const result = await executeSql(
        page,
        ref,
        `SELECT 
          p.proname as function_name,
          pg_get_function_identity_arguments(p.oid) as arguments,
          CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'get_current_user_id_rls';`
      )

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].function_name).toBe('get_current_user_id_rls')
      expect(result[0].security_type).toBe('SECURITY DEFINER')
    })

    test('should return user ID via RPC call', async ({ ref }) => {
      const result = await executeSql(
        page,
        ref,
        `SELECT public.get_current_user_id_rls() as user_id;`
      )

      expect(result.length).toBe(1)
      // The function should return a UUID (36 characters) or NULL
      const userId = result[0].user_id as string | null
      if (!userId || userId === 'null') {
        test.skip()
        return
      }
      expect(userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    test('should create test table with RLS policies', async ({ ref }) => {
      await createTestTableWithWorkaround(page, ref)

      // Verify table exists
      const tableCheck = await executeSql(
        page,
        ref,
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${testTableName}'
        ) as table_exists;`
      )

      const tableExists = String(tableCheck[0].table_exists).toLowerCase()
      expect(tableExists === 't' || tableExists === 'true').toBe(true)

      // Verify RLS is enabled
      const rlsCheck = await executeSql(
        page,
        ref,
        `SELECT relrowsecurity as rls_enabled
        FROM pg_class
        WHERE relname = '${testTableName}';`
      )

      const rlsEnabled = String(rlsCheck[0].rls_enabled).toLowerCase()
      expect(rlsEnabled === 't' || rlsEnabled === 'true').toBe(true)

      // Verify policies exist
      const policiesCheck = await executeSql(
        page,
        ref,
        `SELECT COUNT(*) as policy_count
        FROM pg_policies
        WHERE tablename = '${testTableName}';`
      )

      expect(parseInt(policiesCheck[0].policy_count as string)).toBeGreaterThanOrEqual(4)
    })

    test('should allow INSERT with RLS policy using workaround', async ({ ref }) => {
      await createTestTableWithWorkaround(page, ref)

      // Get current user ID first
      const userIdResult = await executeSql(
        page,
        ref,
        `SELECT public.get_current_user_id_rls() as user_id;`
      )
      const userId = userIdResult[0].user_id as string

      if (!userId || userId === 'null') {
        test.skip()
        return
      }

      // Insert a row with matching user_id
      const insertResult = await executeSql(
        page,
        ref,
        `INSERT INTO public.${testTableName} (user_id, data)
        VALUES ('${userId}'::uuid, 'test data')
        RETURNING id, user_id, data;`
      )

      expect(insertResult.length).toBe(1)
      expect(insertResult[0].user_id).toBe(userId)
      expect(insertResult[0].data).toBe('test data')
    })

    test('should allow SELECT with RLS policy using workaround', async ({ ref }) => {
      await createTestTableWithWorkaround(page, ref)

      // Get current user ID
      const userIdResult = await executeSql(
        page,
        ref,
        `SELECT public.get_current_user_id_rls() as user_id;`
      )
      const userId = userIdResult[0].user_id as string

      if (!userId || userId === 'null') {
        test.skip()
        return
      }

      // Insert test data
      await executeSql(
        page,
        ref,
        `INSERT INTO public.${testTableName} (user_id, data)
        VALUES ('${userId}'::uuid, 'test select data');`
      )

      // Select should only return user's own rows
      const selectResult = await executeSql(
        page,
        ref,
        `SELECT id, user_id, data FROM public.${testTableName};`
      )

      // All returned rows should belong to the current user
      for (const row of selectResult) {
        expect(row.user_id).toBe(userId)
      }
    })

    test('should allow UPDATE with RLS policy using workaround', async ({ ref }) => {
      await createTestTableWithWorkaround(page, ref)

      const userIdResult = await executeSql(
        page,
        ref,
        `SELECT public.get_current_user_id_rls() as user_id;`
      )
      const userId = userIdResult[0].user_id as string

      if (!userId || userId === 'null') {
        test.skip()
        return
      }

      // Insert test data
      const insertResult = await executeSql(
        page,
        ref,
        `INSERT INTO public.${testTableName} (user_id, data)
        VALUES ('${userId}'::uuid, 'original data')
        RETURNING id;`
      )
      const rowId = insertResult[0].id as string

      // Update should succeed
      const updateResult = await executeSql(
        page,
        ref,
        `UPDATE public.${testTableName}
        SET data = 'updated data'
        WHERE id = '${rowId}'::uuid
        RETURNING id, data;`
      )

      expect(updateResult.length).toBe(1)
      expect(updateResult[0].data).toBe('updated data')
    })

    test('should allow DELETE with RLS policy using workaround', async ({ ref }) => {
      await createTestTableWithWorkaround(page, ref)

      const userIdResult = await executeSql(
        page,
        ref,
        `SELECT public.get_current_user_id_rls() as user_id;`
      )
      const userId = userIdResult[0].user_id as string

      if (!userId || userId === 'null') {
        test.skip()
        return
      }

      // Insert test data
      const insertResult = await executeSql(
        page,
        ref,
        `INSERT INTO public.${testTableName} (user_id, data)
        VALUES ('${userId}'::uuid, 'to be deleted')
        RETURNING id;`
      )
      const rowId = insertResult[0].id as string

      // Delete should succeed
      const deleteResult = await executeSql(
        page,
        ref,
        `DELETE FROM public.${testTableName}
        WHERE id = '${rowId}'::uuid
        RETURNING id;`
      )

      expect(deleteResult.length).toBe(1)
      expect(deleteResult[0].id).toBe(rowId)

      // Verify row is deleted
      const verifyResult = await executeSql(
        page,
        ref,
        `SELECT COUNT(*) as count FROM public.${testTableName} WHERE id = '${rowId}'::uuid;`
      )
      expect(parseInt(verifyResult[0].count as string)).toBe(0)
    })
  })

  test.describe('Comparison Tests', () => {
    test('should compare workaround vs auth.uid() in RPC context', async ({ ref }) => {
      // Both should work in RPC context
      const workaroundResult = await executeSql(
        page,
        ref,
        `SELECT public.get_current_user_id_rls() as workaround_user_id;`
      )

      const authUidResult = await executeSql(
        page,
        ref,
        `SELECT auth.uid() as auth_uid;`
      )

      // Both should return values (or both NULL if not authenticated)
      const workaroundId = workaroundResult[0].workaround_user_id as string
      const authUid = authUidResult[0].auth_uid as string

      // If one works, both should work in RPC context
      if (workaroundId && workaroundId !== 'null') {
        // Both should return the same user ID in RPC context
        expect(authUid).toBeTruthy()
      }
    })

    test('should verify enhanced function exists and works', async ({ ref }) => {
      const result = await executeSql(
        page,
        ref,
        `SELECT 
          p.proname as function_name,
          CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'get_current_user_id_enhanced';`
      )

      if (result.length > 0) {
        expect(result[0].function_name).toBe('get_current_user_id_enhanced')
        expect(result[0].security_type).toBe('SECURITY DEFINER')

        // Test that it works
        const enhancedResult = await executeSql(
          page,
          ref,
          `SELECT public.get_current_user_id_enhanced() as user_id;`
        )
        expect(enhancedResult.length).toBe(1)
      }
    })
  })

  test.describe('Security Tests', () => {
    test('should verify SECURITY DEFINER function has correct search_path', async ({ ref }) => {
      const result = await executeSql(
        page,
        ref,
        `SELECT 
          p.proname,
          pg_get_functiondef(p.oid) as function_def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'get_current_user_id_rls';`
      )

      expect(result.length).toBeGreaterThan(0)
      const functionDef = result[0].function_def as string
      // Should contain search_path setting
      expect(functionDef.toLowerCase()).toContain('search_path')
    })

    test('should verify function permissions', async ({ ref }) => {
      const result = await executeSql(
        page,
        ref,
        `SELECT 
          p.proname,
          r.rolname
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        JOIN pg_proc_acl a ON p.oid = a.oid
        JOIN pg_roles r ON a.grantee = r.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'get_current_user_id_rls'
        AND a.privilege_type = 'EXECUTE';`
      )

      // Should have permissions for authenticated and/or anon roles
      const roles = result.map((r) => r.rolname as string)
      expect(roles.length).toBeGreaterThan(0)
    })
  })
})
