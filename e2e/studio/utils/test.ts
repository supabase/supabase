import path from 'path'
import { test as base } from '@playwright/test'
import dotenv from 'dotenv'

import { env } from '../env.config.js'
import { SCAN_THEME, THEME_STORAGE_KEY } from './axe-helpers.ts'

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
    await page.addInitScript(
      ({ ref, themeKey, theme }) => {
        localStorage.setItem(
          `table-editor-queue-operations-banner-dismissed-${ref}`,
          JSON.stringify(true)
        )
        localStorage.setItem(`terms-of-service-update-2026-08-01`, JSON.stringify(true))
        // Any spec can host an a11y checkpoint and contrast findings are
        // theme-specific, so every spec renders the theme the baseline was captured in.
        localStorage.setItem(themeKey, theme)
      },
      { ref, themeKey: THEME_STORAGE_KEY, theme: SCAN_THEME }
    )
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
