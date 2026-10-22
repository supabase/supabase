import { expect } from '@playwright/test'

import { dropTable } from '../utils/db/index.js'
import { createTable } from '../utils/db/queries.js'
import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { waitForGridDataToLoad, waitForTableToLoad } from '../utils/wait-for-response.js'

test('schema switch keeps the open table and back restores the schema', async ({ page, ref }) => {
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
  await page.evaluate((projectRef) => {
    localStorage.removeItem(`dashboard-history-${projectRef}`)
    localStorage.removeItem(`supabase_studio_tabs_${projectRef}`)
  }, ref)
  const publicReload = waitForTableToLoad(page, ref, 'public')
  await page.reload()
  await publicReload
  await expect(page).toHaveURL(/\/editor\?schema=public/)

  const gridLoad = waitForGridDataToLoad(page, ref)
  await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
  await page.waitForURL(/\/editor\/\d+\?schema=public/)
  await gridLoad
  await expect(page.getByRole('tab', { name: new RegExp(tableName) })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Schema public' })).toBeVisible()

  const historyLength = () => page.evaluate(() => history.length)
  const historyBeforeSchemaChange = await historyLength()
  const tableId = page.url().match(/\/editor\/(\d+)/)?.[1]
  expect(tableId).toBeTruthy()

  await page.getByTestId('schema-selector').click()
  await page.getByPlaceholder('Find schema...').fill('auth')
  const authLoad = waitForTableToLoad(page, ref, 'auth')
  await page.getByRole('option', { name: 'auth', exact: true }).click()
  await authLoad
  await expect(page).toHaveURL(new RegExp(`/editor/${tableId}\\?`))
  await expect(page).toHaveURL(/schema=auth/)
  await expect(page).not.toHaveURL(/\/editor\?schema=/)
  await expect(page.getByRole('combobox', { name: 'Schema auth' })).toBeVisible()
  await expect(page.getByRole('tab', { name: new RegExp(tableName) })).toBeVisible()
  expect(await historyLength()).toBe(historyBeforeSchemaChange + 1)

  await page.goBack()
  await expect(page).toHaveURL(new RegExp(`/editor/${tableId}\\?`))
  await expect(page).toHaveURL(/schema=public/)
  await expect(page.getByRole('combobox', { name: 'Schema public' })).toBeVisible()
  await expect(page.getByRole('tab', { name: new RegExp(tableName) })).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`/editor/${tableId}`))

  const authIndexLoad = waitForTableToLoad(page, ref, 'auth')
  await page.goto(toUrl(`/project/${ref}/editor?schema=auth`))
  await authIndexLoad
  await expect(page).toHaveURL(new RegExp(`/editor/${tableId}\\?`))
  await expect(page).toHaveURL(/schema=auth/)
  await expect(page).not.toHaveURL(/schema=public/)
  await expect(page.getByRole('combobox', { name: 'Schema auth' })).toBeVisible()
  await expect(page.getByRole('tab', { name: new RegExp(tableName) })).toBeVisible()

  const freshLoad = waitForTableToLoad(page, ref, 'public')
  await page.goto(toUrl(`/project/${ref}/editor`))
  await freshLoad
  await expect(page).toHaveURL(new RegExp(`/editor/${tableId}`))
  await expect(page.getByRole('tab', { name: new RegExp(tableName) })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Schema public' })).toBeVisible()
})
