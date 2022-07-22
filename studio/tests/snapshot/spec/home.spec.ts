import { test, expect, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('http://localhost:3000')

  await page.route(/rest\/v1/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })
})

test.describe('Start page', () => {
  test('should open start page', async ({ page }) => {
    const title = await page.title()
    expect(title).toContain('Supabase')
  })

  test('snapshot project list', async ({ page }) => {
    const projects = page.locator('#with-sidebar + .flex-1')

    await page.waitForLoadState('networkidle')
    await expect(projects).toHaveScreenshot()
  })

  test('snapshot sidebar', async ({ page }) => {
    const sidebar = page.locator('#with-sidebar')

    await page.waitForLoadState('networkidle')
    await expect(sidebar).toHaveScreenshot()
  })
})
