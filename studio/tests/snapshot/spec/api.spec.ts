import { test, expect, type Page } from '@playwright/test'
import api from '../stubs/api.json'
import spec from '../stubs/spec.json'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })

  // add stub replies from the backend
  await page.route(/\?apikey/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(api),
    })
  })

  await page.route(/api\/props\/project\/default\/api/, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(spec),
    })
  })

  await page.route(/rest\/v1/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })
})

test.describe('API page', () => {
  test('should open API', async ({ page }) => {
    await page.goto('http://localhost:3000/project/default/api')
    const title = page.locator('h4', { hasText: 'API Docs' })

    await expect(title).toBeVisible()
  })

  test.describe('Snapshot base views for API', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/project/default/api')
    })

    test('api header', async ({ page }) => {
      const header = page.locator('main > div').first()

      await page.waitForLoadState('networkidle')
      await expect(header).toHaveScreenshot()
    })

    test('api sidebar', async ({ page }) => {
      const sidebar = page.locator('css=main >> xpath=../div[1]')

      await page.waitForLoadState('networkidle')
      await expect(sidebar).toHaveScreenshot()
    })

    test('api menu', async ({ page }) => {
      const menu = page.locator('css=main >> xpath=../div[2]')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })
  })
})
