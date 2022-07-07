import { test, expect, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('http://localhost:3000/project/default')
})

test.describe('Project dashboard', () => {
  test('should open start page', async ({ page }) => {
    const title = page.locator('h2', { hasText: 'Welcome to your project' })
    await expect(title).toBeVisible()
  })

  test('snapshot project dashboard header', async ({ page }) => {
    const header = page.locator('css=.PageHeader >> xpath=..')

    await page.waitForLoadState('networkidle')
    await expect(header).toHaveScreenshot()
  })

  test('snapshot project dashboard body', async ({ page }) => {
    const body = page.locator('main > .flex')

    await page.waitForLoadState('networkidle')
    await expect(body).toHaveScreenshot()
  })

  test('snapshot project dashboard sidebar', async ({ page }) => {
    const sidebar = page.locator('css=main >> xpath=../div[1]')

    await page.waitForLoadState('networkidle')
    await expect(sidebar).toHaveScreenshot()
  })
})
