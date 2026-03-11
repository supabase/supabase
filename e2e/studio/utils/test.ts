import path from 'path'
import { test as base } from '@playwright/test'
import dotenv from 'dotenv'

import { env } from '../env.config.js'

dotenv.config({
  path: path.resolve(import.meta.dirname, '../.env.local'),
  override: true,
})

export interface TestOptions {
  env: string
  ref: string
  apiUrl: string
}

export const test = base.extend<TestOptions>({
  env: env.STUDIO_URL,
  ref: env.PROJECT_REF ?? 'default',
  apiUrl: env.API_URL,
  page: async ({ page }, use) => {
    const ref = env.PROJECT_REF ?? 'default'
    await page.addInitScript((ref) => {
      localStorage.setItem(`table-editor-new-filter-banner-dismissed-${ref}`, JSON.stringify(true))
    }, ref)
    await use(page)
  },
})

/**
 * A function that returns a disposable object. Calling it with using keyword ensures that the cleanup function
 * will be called whether the test succeeded or not.
 *
 * @example
 * await using _ = await withSetupCleanup(
 *   () => createTableWithRLS('pw_table', 'pw_column'),
 *   async () => {
 *     await dropTable('pw_table')
 *   }
 * )
 * @param setup The setup function (create tables, etc.)
 * @param cleanup The cleanup function (remove tables, etc.)
 * @returns A disposable object
 */
export const withSetupCleanup = async (
  setup: () => Promise<void>,
  cleanup: () => Promise<void>
) => {
  await setup()
  return {
    async [Symbol.asyncDispose]() {
      await cleanup()
    },
  }
}
