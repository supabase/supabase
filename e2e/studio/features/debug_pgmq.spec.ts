import { expect } from '@playwright/test'
import { test } from './utils/test.js'
import { toUrl } from './utils/to-url.js'
import { env } from './env.config.js'
import { query } from './utils/db/index.js'
import { createApiResponseWaiter } from './utils/wait-for-response.js'

test('debug pgmq modal text', async ({ page, ref }) => {
  await query(`DROP EXTENSION IF EXISTS pgmq CASCADE;`)
  const extensionsWait = createApiResponseWaiter(page, 'pg-meta', ref, 'query?key=database-extensions')
  await page.goto(toUrl(`/project/${env.PROJECT_REF}/database/extensions`))
  await extensionsWait
  await page.getByPlaceholder('Search for an extension').fill('pgmq')
  const row = page.getByRole('row').filter({ hasText: 'pgmq' }).first()
  await expect(row).toBeVisible()
  await row.getByRole('switch').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  // Wait for loading to finish
  await expect(dialog.locator('.animate-pulse').first()).not.toBeVisible({ timeout: 10000 }).catch(() => {})
  const text = await dialog.innerText()
  console.log('DIALOG TEXT:', JSON.stringify(text))
  await page.waitForTimeout(2000)
  const text2 = await dialog.innerText()
  console.log('DIALOG TEXT AFTER WAIT:', JSON.stringify(text2))
})
