import { expect, Page } from '@playwright/test'
import { waitForApiResponse } from './wait-for-response.js'

/**
 * Opens the context menu for a table in the sidebar.
 * Hovers over the table button first to reveal the menu button, then clicks it.
 */
export async function openTableContextMenu(page: Page, tableName: string) {
  const tableButton = page.getByRole('button', { name: `View ${tableName}`, exact: true })
  await tableButton.hover()
  // The menu button appears on hover - wait for it to be visible before clicking
  const menuButton = tableButton.locator('button[aria-haspopup="menu"]')
  await expect(menuButton).toBeVisible()
  await menuButton.click()
}

/**
 * Deletes a table using its context menu.
 * Checks if the table exists first, navigates to it, and then deletes it with cascade.
 */
export async function deleteTable(page: Page, ref: string, tableName: string) {
  const viewLocator = page.getByRole('button', { name: `View ${tableName}`, exact: true })
  if ((await viewLocator.count()) === 0) return
  await viewLocator.click()
  await openTableContextMenu(page, tableName)

  await page.getByRole('menuitem', { name: 'Delete table' }).click()
  await page.getByRole('checkbox', { name: 'Drop table with cascade?' }).click()
  const apiPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-delete-', {
    method: 'POST',
  })
  const revalidatePromise = waitForApiResponse(page, 'pg-meta', ref, `query?key=entity-types-`)
  await page.getByRole('button', { name: 'Delete' }).click()
  await Promise.all([apiPromise, revalidatePromise])

  await expect(page.getByTestId('confirm-delete-table-modal')).not.toBeVisible()
}