import { expect } from '@playwright/test'

import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

test.describe('Connect', async () => {
  test('ConnectSheet opens when showConnect=true query param is present', async ({ page, ref }) => {
    // Navigate to project page with showConnect=true query param
    await page.goto(toUrl(`/project/${ref}?showConnect=true`))

    // Check that the ConnectSheet is visible
    await expect(page.getByRole('heading', { name: 'Connect to your project' })).toBeVisible({
      timeout: 30000,
    })
  })

  test('ConnectSheet closes when dismissed', async ({ page, ref }) => {
    // Navigate to project page with showConnect=true query param
    await page.goto(toUrl(`/project/${ref}?showConnect=true`))

    // Wait for the ConnectSheet to be visible
    await expect(page.getByRole('heading', { name: 'Connect to your project' })).toBeVisible({
      timeout: 30000,
    })

    // Close the sheet by pressing Escape
    await page.keyboard.press('Escape')

    // Verify the sheet is no longer visible
    await expect(page.getByRole('heading', { name: 'Connect to your project' })).not.toBeVisible({
      timeout: 10000,
    })

    // Verify the query param is removed from the URL
    await expect(page).not.toHaveURL(/showConnect=true/)
  })

  test('Connect button in header opens the ConnectSheet', async ({ page, ref }) => {
    // Navigate to project page without the query param
    await page.goto(toUrl(`/project/${ref}`))

    // Wait for the page to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000 })

    // Click the Connect button in the header
    await page.getByRole('button', { name: 'Connect' }).click()

    // Verify the ConnectSheet opens
    await expect(page.getByRole('heading', { name: 'Connect to your project' })).toBeVisible({
      timeout: 30000,
    })

    // Verify the URL has the showConnect query param
    await expect(page).toHaveURL(/showConnect=true/)
  })
})
