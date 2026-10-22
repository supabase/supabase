import { expect } from '@playwright/test'

import { createTable, dropTable, query } from '../utils/db/index.js'
import { test, withSetupCleanup } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { waitForGridDataToLoad, waitForTableToLoad } from '../utils/wait-for-response.js'

test('schema switch replaces history and back leaves the editor', async ({ page, ref }) => {
  const tableName = 'pw_schema_back'

  await using _cleanup = await withSetupCleanup(
    () => createTable(tableName, 'name'),
    async () => {
      await dropTable(tableName)
    }
  )

  const [{ id: tableId }] = await query<{ id: number }>(
    `select c.oid::int as id
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = $1`,
    [tableName]
  )

  await page.goto(toUrl(`/project/${ref}`))
  const gridLoad = waitForGridDataToLoad(page, ref)
  await page.goto(toUrl(`/project/${ref}/editor/${tableId}?schema=public`))
  await page.waitForURL(new RegExp(`/editor/${tableId}\\?schema=public`))
  await gridLoad
  await expect(page.getByRole('tab', { name: new RegExp(tableName) })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Schema public' })).toBeVisible()

  const historyLength = () => page.evaluate(() => history.length)
  const historyBeforeSchemaChange = await historyLength()

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
  expect(await historyLength()).toBe(historyBeforeSchemaChange)

  await page.goBack()
  await expect
    .poll(() => page.url(), {
      message: 'a queued schema write would bounce back onto /editor',
    })
    .toMatch(new RegExp(`/project/${ref}/?$`))
  await expect(page, 'a queued schema write would bounce back onto /editor').not.toHaveURL(
    /\/editor/
  )

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

  // Clear and leave in one turn. A later reload of the open table records that
  // table id again before the list document can read empty storage.
  const listLoad = waitForTableToLoad(page, ref, 'public')
  const listUrl = page.waitForURL(/\/editor\?schema=public/)
  const leftTable = page
    .evaluate((projectRef) => {
      localStorage.removeItem(`dashboard-history-${projectRef}`)
      localStorage.removeItem(`supabase_studio_tabs_${projectRef}`)
      const url = new URL(window.location.href)
      url.pathname = `/project/${projectRef}/editor`
      url.search = '?schema=public'
      window.location.replace(url.toString())
    }, ref)
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('context was destroyed') && !message.includes('navigation')) {
        throw error
      }
    })
  await Promise.all([listUrl, leftTable])
  await listLoad
  await expect(page).toHaveURL(/\/editor\?schema=public/)
  await page.reload()
  await expect(page).toHaveURL(/\/editor\?schema=public/)

  const reopenLoad = waitForGridDataToLoad(page, ref)
  await page.getByRole('button', { name: `View ${tableName}`, exact: true }).click()
  await page.waitForURL(new RegExp(`/editor/${tableId}\\?schema=public`))
  await reopenLoad

  await page.goBack()
  await expect(
    page.getByRole('button', { name: `View ${tableName}`, exact: true }),
    'a queued schema write would bounce back onto /editor'
  ).toBeVisible()
  await expect
    .poll(() => page.url(), {
      message: 'a queued schema write would bounce back onto /editor',
    })
    .toMatch(/\/editor\?schema=public/)
  await expect(page, 'a queued schema write would bounce back onto /editor').not.toHaveURL(
    new RegExp(`/editor/${tableId}`)
  )
})

test('a full back to /editor does not open the last table', async ({ page, ref }) => {
  const tableName = 'pw_schema_back_doc'

  await using _cleanup = await withSetupCleanup(
    () => createTable(tableName, 'name'),
    async () => {
      await dropTable(tableName)
    }
  )

  const [{ id: tableId }] = await query<{ id: number }>(
    `select c.oid::int as id
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = $1`,
    [tableName]
  )

  await page.goto(toUrl(`/project/${ref}/editor?schema=public`))
  await page.evaluate((projectRef) => {
    localStorage.removeItem(`dashboard-history-${projectRef}`)
    localStorage.removeItem(`supabase_studio_tabs_${projectRef}`)
  }, ref)
  await page.reload()
  await expect(page).toHaveURL(/\/editor\?schema=public/)

  const gridLoad = waitForGridDataToLoad(page, ref)
  await page.goto(toUrl(`/project/${ref}/editor/${tableId}?schema=public`))
  await gridLoad
  await expect
    .poll(() =>
      page.evaluate((projectRef) => localStorage.getItem(`dashboard-history-${projectRef}`), ref)
    )
    .toContain(String(tableId))

  await page.goto(toUrl(`/project/${ref}`))
  await page.goBack()
  await expect(page).toHaveURL(new RegExp(`/editor/${tableId}`))

  await page.goBack()
  await expect(
    page.getByRole('button', { name: `View ${tableName}`, exact: true }),
    'a document back_forward load used to settle before the editor read the flag'
  ).toBeVisible()
  await expect
    .poll(() => page.url(), {
      message: 'a document back_forward load used to settle before the editor read the flag',
    })
    .toMatch(/\/editor\?schema=public/)
  await expect(
    page,
    'a document back_forward load used to settle before the editor read the flag'
  ).not.toHaveURL(new RegExp(`/editor/${tableId}`))
})
