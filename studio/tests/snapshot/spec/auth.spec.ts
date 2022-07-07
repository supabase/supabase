import { test, expect, type Page } from '@playwright/test'
import tables from '../stubs/tables.policies.json'
import policies from '../stubs/policies.json'
import roles from '../stubs/roles.json'
import users from '../stubs/users.json'
import config from '../stubs/auth.config.json'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })

  // add stub replies from the backend
  await page.route(/api\/pg-meta\/default\/tables/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(tables),
    })
  })
  await page.route(/api\/pg-meta\/default\/policies/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(policies),
    })
  })
  await page.route(/api\/pg-meta\/default\/roles/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(roles),
    })
  })
  await page.route(/api\/auth\/default\/users/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(users),
    })
  })
  await page.route(/api\/auth\/default\/config/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(config),
    })
  })
})

test.describe('Auth Users page', () => {
  test('should open auth users', async ({ page }) => {
    await page.goto('http://localhost:3000/project/default/auth/users')
    const title = page.locator('h4', { hasText: 'Authentication' })

    await expect(title).toBeVisible()
  })

  test.describe('Snapshot base views for users management', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/project/default/auth/users')
    })

    test('users management header', async ({ page }) => {
      const header = page.locator('css=.PageHeader >> xpath=..')

      await page.waitForLoadState('networkidle')
      await expect(header).toHaveScreenshot()
    })

    test('users management sidebar', async ({ page }) => {
      const sidebar = page.locator('css=main >> xpath=../div[1]')

      await page.waitForLoadState('networkidle')
      await expect(sidebar).toHaveScreenshot()
    })

    test('users management menu', async ({ page }) => {
      const menu = page.locator('css=main >> xpath=../div[2]')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })

    test('users management table', async ({ page }) => {
      const body = page.locator('main > .flex')

      await page.waitForLoadState('networkidle')
      await expect(body).toHaveScreenshot()
    })

    test('users management invite', async ({ page }) => {
      const body = page.locator('main > .flex')
      await body.locator('"Invite"').click()

      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot()
    })
  })

  test.describe('Snapshot base views for Policies', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/project/default/auth/policies')
    })

    test('policies header', async ({ page }) => {
      const header = page.locator('css=.PageHeader >> xpath=..')

      await page.waitForLoadState('networkidle')
      await expect(header).toHaveScreenshot()
    })

    test('policies sidebar', async ({ page }) => {
      const sidebar = page.locator('css=main >> xpath=../div[1]')

      await page.waitForLoadState('networkidle')
      await expect(sidebar).toHaveScreenshot()
    })

    test('policies menu', async ({ page }) => {
      const menu = page.locator('css=main >> xpath=../div[2]')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })

    test('policies table', async ({ page }) => {
      const body = page.locator('main > .flex')

      await page.waitForLoadState('networkidle')
      await expect(body).toHaveScreenshot()
    })

    test('policies new', async ({ page }) => {
      const body = page.locator('main > .flex')
      await body.locator('"New Policy"').click()

      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot()
    })

    test('policies new from template', async ({ page }) => {
      const body = page.locator('main > .flex')
      await body.locator('"New Policy"').click()

      await page.click('"Create a policy from a template"')

      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot()
    })

    test('policies new from scratch', async ({ page }) => {
      const body = page.locator('main > .flex')
      await body.locator('"New Policy"').click()

      await page.click('"Create a policy from scratch"')

      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot()
    })
  })

  test.describe('Snapshot base views for templates', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/project/default/auth/templates')
    })

    test('templates header', async ({ page }) => {
      const header = page.locator('css=.PageHeader >> xpath=..')

      await page.waitForLoadState('networkidle')
      await expect(header).toHaveScreenshot()
    })

    test('templates sidebar', async ({ page }) => {
      const sidebar = page.locator('css=main >> xpath=../div[1]')

      await page.waitForLoadState('networkidle')
      await expect(sidebar).toHaveScreenshot()
    })

    test('templates menu', async ({ page }) => {
      const menu = page.locator('css=main >> xpath=../div[2]')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })

    test('templates body', async ({ page }) => {
      const body = page.locator('main > .flex')

      await page.waitForLoadState('networkidle')
      await expect(body).toHaveScreenshot()
    })
  })
})
