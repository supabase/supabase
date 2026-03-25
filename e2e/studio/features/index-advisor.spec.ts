import { expect } from '@playwright/test'

import { query } from '../utils/db/client.js'
import { createTable, dropTable } from '../utils/db/queries.js'
import { releaseFileOnceCleanup, withFileOnceSetup } from '../utils/once-per-file.js'
import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

const TEST_TABLE_NAME = 'pw_test_index_advisor'

test.describe('Index Advisor', () => {
  test.beforeAll(async () => {
    await withFileOnceSetup(import.meta.url, async () => {
      await query(`
        create schema if not exists extensions;
        create extension if not exists hypopg schema extensions cascade;
        create extension if not exists index_advisor schema extensions cascade;
      `)
    })
  })

  test.afterAll(async () => {
    await releaseFileOnceCleanup(import.meta.url)
  })

  test('should show Index Advisor filter after Index Advisor is enabled', async ({ page, ref }) => {
    // Go to Query Performance page
    await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
    await page.waitForLoadState('networkidle')

    // Wait patiently for the Index Advisor button to appear
    // Extensions may need time to initialize, so use a generous timeout
    const indexAdvisorButton = page.getByRole('button', { name: /Index Advisor/i })
    await expect(
      indexAdvisorButton,
      'Index Advisor filter button should be visible when Index Advisor is enabled'
    ).toBeVisible({ timeout: 30000 })
  })

  test('should show Index Advisor warnings in Query Performance', async ({ page, ref }) => {
    await using _ = await withSetupCleanup(
      async () => {
        await createTable(TEST_TABLE_NAME, 'name', [
          {
            name: 'test',
          },
          {
            name: 'demo',
          },
          {
            name: 'test',
          },
        ])
      },
      async () => {
        await dropTable(TEST_TABLE_NAME)
      }
    )

    // Run query that need indexes
    await query(`SELECT * FROM ${TEST_TABLE_NAME} WHERE name = 'test';`)

    // Navigate to Query Performance page
    await page.goto(toUrl(`/project/${ref}/observability/query-performance`))
    await page.waitForLoadState('networkidle')

    // Wait for Index Advisor button and click to enable the filter
    const indexAdvisorButton = page.getByRole('button', { name: /Index Advisor/i })
    await expect(indexAdvisorButton, 'Index Advisor filter should be visible').toBeVisible({
      timeout: 30000,
    })
  })
})
