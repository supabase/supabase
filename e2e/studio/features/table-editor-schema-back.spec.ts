import { expect } from '@playwright/test'

import { dropTable } from '../utils/db/index.js'
import { createTable } from '../utils/db/queries.js'
import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { waitForGridDataToLoad, waitForTableToLoad } from '../utils/wait-for-response.js'

test('back after switching schema with a table open stays on the list', async ({ page, ref }) => {
  const tableName = 'pw_schema_back'

  await using _cleanup = await withSetupCleanup(
    () => createTable(tableName, 'name'),
    async () => {
      await dropTable(tableName)
    }
  )

  const publicLoad = waitForTableToLoad(page, ref, 'public')
  await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
  await publicLoad

  const gridLoad = waitForGridDataToLoad(page, ref)
  await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
  await page.waitForURL(/\/editor\/\d+\?schema=public/)
  await gridLoad
  await expect(page.getByRole('tab', { name: new RegExp(tableName) })).toBeVisible()

  await page.getByTestId('schema-selector').click()
  await page.getByPlaceholder('Find schema...').fill('auth')
  const authLoad = waitForTableToLoad(page, ref, 'auth')
  await page.getByRole('option', { name: 'auth', exact: true }).click()
  await authLoad
  await expect(page).toHaveURL(/\/editor\?schema=auth$/)

  await page.getByTestId('schema-selector').click()
  await page.getByPlaceholder('Find schema...').fill('extensions')
  const extensionsLoad = waitForTableToLoad(page, ref, 'extensions')
  await page.getByRole('option', { name: 'extensions', exact: true }).click()
  await extensionsLoad
  await expect(page).toHaveURL(/\/editor\?schema=extensions$/)

  await page.goBack()
  await expect(page).toHaveURL(/\/editor\?schema=public/)
  await expect(page.getByRole('button', { name: `View ${tableName}`, exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/editor\?schema=public/)

  const remountedGridLoad = waitForGridDataToLoad(page, ref)
  await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
  await page.waitForURL(/\/editor\/\d+\?schema=public/)
  await remountedGridLoad
  await expect(page.getByRole('tab', { name: new RegExp(tableName) })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/editor\?schema=public/)
  await expect(page.getByRole('button', { name: `View ${tableName}`, exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/editor\?schema=public/)
})
