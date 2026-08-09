import fs from 'fs'
import { expect } from '@playwright/test'

import { env } from '../env.config.js'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

/**
 * Regression guard for #47577: on self-hosted, "Generate and download types"
 * must produce types for exactly the schemas exposed via PostgREST — not every
 * schema in the database.
 *
 */
test.describe('Data API docs - type generation', () => {
  // The download runs through the self-hosted pg-meta route; on platform the
  // request goes to the managed API instead.
  test.skip(
    env.IS_PLATFORM,
    'Type generation via pg-meta is the self-hosted (IS_PLATFORM=false) code path'
  )

  test('generates types for exposed schemas only', async ({ page, ref }) => {
    await page.goto(toUrl(`/project/${ref}/integrations/data_api/docs?page=tables-intro`))

    const generateButton = page.getByRole('button', { name: 'Generate and download types' })
    await expect(
      generateButton,
      'Generate types button should render on the Tables introduction page'
    ).toBeVisible({ timeout: 30000 })

    // Set up the download waiter before triggering the action.
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })
    await generateButton.click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('supabase.ts')

    const downloadPath = await download.path()
    const types = fs.readFileSync(downloadPath, 'utf-8')
    fs.unlinkSync(downloadPath)

    // The public schema is always exposed.
    expect(types, 'Generated types should include the public schema').toMatch(/\n\s*public:\s*\{/)

    // A non-public exposed schema is included — proves non-public schemas flow
    // through, not just `public`. graphql_public is guaranteed here because the
    // e2e stack pins `[api].schemas = ["public", "graphql_public"]` in
    // e2e/studio/supabase/config.toml (and the CLI's Postgres ships pg_graphql,
    // which creates the schema).
    expect(types, 'Generated types should include the exposed graphql_public schema').toContain(
      'graphql_public'
    )

    // Internal, non-exposed schemas must NOT leak in. Before #47577 the include
    // list was ignored, so every schema (auth, vault, ...) ended up in the output.
    expect(types, 'Generated types should not include the internal auth schema').not.toMatch(
      /\n\s*auth:\s*\{/
    )
    expect(types, 'Generated types should not include the internal vault schema').not.toMatch(
      /\n\s*vault:\s*\{/
    )
  })
})
