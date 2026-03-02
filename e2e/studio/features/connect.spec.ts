import { expect } from '@playwright/test'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

test.describe('Connect', async () => {
  test('Connect dialog opens when showConnect=true query param is present', async ({
    page,
    ref,
  }) => {
    // Navigate to project page with showConnect=true query param
    await page.goto(toUrl(`/project/${ref}?showConnect=true`))

    // Wait for the page to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 })

    // Check that either the Connect dialog or ConnectSheet is visible
    // The Connect component renders a Dialog with title "Connect to your project"
    // The ConnectSheet component renders a Sheet with title "Connect to your project"
    await expect(
      page.getByRole('heading', { name: 'Connect to your project' })
    ).toBeVisible({ timeout: 30000 })
  })

  test('Connect dialog closes when dismissed', async ({ page, ref }) => {
    // Navigate to project page with showConnect=true query param
    await page.goto(toUrl(`/project/${ref}?showConnect=true`))

    // Wait for the page to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 })

    // Wait for the Connect dialog/sheet to be visible
    await expect(
      page.getByRole('heading', { name: 'Connect to your project' })
    ).toBeVisible({ timeout: 30000 })

    // Close the dialog by pressing Escape
    await page.keyboard.press('Escape')

    // Verify the dialog is no longer visible
    await expect(
      page.getByRole('heading', { name: 'Connect to your project' })
    ).not.toBeVisible({ timeout: 10000 })

    // Verify the query param is removed from the URL
    await expect(page).not.toHaveURL(/showConnect=true/)
  })

  test('Connect button in header opens the Connect dialog', async ({ page, ref }) => {
    // Navigate to project page without the query param
    await page.goto(toUrl(`/project/${ref}`))

    // Wait for the page to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 })

    // Click the Connect button in the header
    await page.getByRole('button', { name: 'Connect' }).click()

    // Verify the Connect dialog/sheet opens
    await expect(
      page.getByRole('heading', { name: 'Connect to your project' })
    ).toBeVisible({ timeout: 30000 })

    // Verify the URL has the showConnect query param
    await expect(page).toHaveURL(/showConnect=true/)
  })
})
