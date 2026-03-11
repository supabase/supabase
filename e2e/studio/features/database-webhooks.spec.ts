import { expect, Page } from '@playwright/test'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'
import { createTable, dropTable } from '../utils/db/index.js'

const ensureWebhooksEnabled = async (page: Page, ref: string) => {
  await page.goto(toUrl(`/project/${ref}/integrations/webhooks/overview`))
  await expect(
    page.getByText('Database Webhooks allow you to send real-time data')
  ).toBeVisible({ timeout: 30000 })

  const enableButton = page.getByRole('button', { name: 'Enable webhooks' })
  if ((await enableButton.count()) > 0) {
    await enableButton.click()
    await expect(page.getByText('Successfully enabled webhooks')).toBeVisible({ timeout: 15000 })
  }
}

const navigateToWebhooksList = async (page: Page, ref: string) => {
  await page.goto(toUrl(`/project/${ref}/integrations/webhooks/webhooks`))
  await expect(page.getByPlaceholder('Search for a webhook')).toBeVisible({ timeout: 30000 })
}

const createWebhookViaUI = async (page: Page, hookName: string, tableName: string) => {
  await page.getByRole('button', { name: 'Create a new hook' }).click()
  await expect(page.getByText('Create a new database webhook')).toBeVisible({ timeout: 10000 })

  await page.locator('input[name="name"]').fill(hookName)

  await page.getByRole('combobox').filter({ hasText: 'Select a table' }).click()
  await page.getByRole('option', { name: new RegExp(tableName) }).click()

  await page.locator('#event-INSERT').click()

  await page
    .getByPlaceholder('http://api.com/path/resource')
    .fill('http://localhost:3000/test-webhook')

  await page.getByRole('button', { name: 'Create webhook' }).click()
  await expect(
    page.getByText(`Successfully created new webhook "${hookName}"`)
  ).toBeVisible({ timeout: 10000 })
}

const deleteWebhookViaUI = async (page: Page, name: string) => {
  const webhookText = page.getByText(name, { exact: true })
  const webhookRow = page.locator('tr').filter({ has: webhookText })
  await webhookRow.getByRole('button').click()

  await page.getByRole('menuitem', { name: 'Delete hook' }).click()

  await expect(page.getByRole('heading', { name: 'Delete database webhook' })).toBeVisible()
  await page.getByPlaceholder('Type in name of webhook').fill(name)
  await page.getByRole('button', { name: `Delete ${name}` }).click()

  await expect(page.getByText(`Successfully deleted ${name}`)).toBeVisible({ timeout: 10000 })
  await expect(webhookRow).not.toBeVisible({ timeout: 10000 })
}

const setupTable = async (tableName: string) => {
  await dropTable(tableName)
  await createTable(tableName, 'data')
}

const uniqueNames = (prefix: string) => {
  const i = test.info().parallelIndex
  return { table: `pw_wh_${prefix}_tbl_${i}`, hook: `pw_wh_${prefix}_${i}` }
}

test.describe('Database Webhooks', () => {
  test('can view webhooks list page', async ({ page, ref }) => {
    await ensureWebhooksEnabled(page, ref)
    await navigateToWebhooksList(page, ref)

    await expect(page.getByPlaceholder('Search for a webhook')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create a new hook' })).toBeVisible()
  })

  test('can create a new webhook with correct toast message', async ({ page, ref }) => {
    const { table, hook } = uniqueNames('create')
    await setupTable(table)

    try {
      await ensureWebhooksEnabled(page, ref)
      await navigateToWebhooksList(page, ref)

      await page.getByRole('button', { name: 'Create a new hook' }).click()
      await expect(page.getByText('Create a new database webhook')).toBeVisible({ timeout: 10000 })

      await page.locator('input[name="name"]').fill(hook)
      await page.getByRole('combobox').filter({ hasText: 'Select a table' }).click()
      await page.getByRole('option', { name: new RegExp(table) }).click()
      await page.locator('#event-INSERT').click()
      await page
        .getByPlaceholder('http://api.com/path/resource')
        .fill('http://localhost:3000/test-webhook')

      await page.getByRole('button', { name: 'Create webhook' }).click()

      await expect(
        page.getByText(`Successfully created new webhook "${hook}"`)
      ).toBeVisible({ timeout: 10000 })

      await expect(page.getByText(hook, { exact: true })).toBeVisible({ timeout: 10000 })
    } finally {
      await dropTable(table)
    }
  })

  test('can edit a webhook with correct toast message', async ({ page, ref }) => {
    const { table, hook } = uniqueNames('edit')
    await setupTable(table)

    try {
      await ensureWebhooksEnabled(page, ref)
      await navigateToWebhooksList(page, ref)
      await createWebhookViaUI(page, hook, table)

      const webhookText = page.getByText(hook, { exact: true })
      const webhookRow = page.locator('tr').filter({ has: webhookText })
      await webhookRow.getByRole('button').click()

      await page.getByRole('menuitem', { name: 'Edit hook' }).click()

      await expect(page.getByText(`Update webhook ${hook}`)).toBeVisible({ timeout: 10000 })

      const urlInput = page.getByPlaceholder('http://api.com/path/resource')
      await urlInput.clear()
      await urlInput.fill('http://localhost:3000/test-webhook-updated')

      await page.getByRole('button', { name: 'Update webhook' }).click()

      await expect(
        page.getByText(`Successfully updated webhook "${hook}"`)
      ).toBeVisible({ timeout: 10000 })

      await expect(page.getByText('Webhook not found')).not.toBeVisible()
    } finally {
      await dropTable(table)
    }
  })

  test('can delete a webhook with correct toast message', async ({ page, ref }) => {
    const { table, hook } = uniqueNames('delete')
    await setupTable(table)

    try {
      await ensureWebhooksEnabled(page, ref)
      await navigateToWebhooksList(page, ref)
      await createWebhookViaUI(page, hook, table)

      await deleteWebhookViaUI(page, hook)

      await expect(page.getByText(`Successfully deleted ${hook}`)).toBeVisible({ timeout: 10000 })

      await expect(page.getByText(hook, { exact: true })).not.toBeVisible()
    } finally {
      await dropTable(table)
    }
  })
})
