import { expect, test } from '@playwright/test'
import config from '../stubs/auth.config.json'
import policies from '../stubs/policies.json'
import roles from '../stubs/roles.json'
import tables from '../stubs/tables.policies.json'
import users from '../stubs/users.json'

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
  await page.route(/rest\/v1/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    })
  })
})

test.describe('Auth Users page', () => {
  test('should open auth users', async ({ page }) => {
    await page.goto('/project/default/auth/users')
    const title = page.locator('h4', { hasText: 'Authentication' })

    await expect(title).toBeVisible()
  })

  test.describe('Snapshot base views for users management', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/project/default/auth/users')
    })

    test.skip('users management header', async ({ page }) => {
      const header = page.locator('main > div').first()

      await page.waitForLoadState('networkidle')
      await expect(header).toHaveScreenshot()
    })

    test.skip('users management sidebar', async ({ page }) => {
      const sidebar = page.locator('css=main >> xpath=../div[1]').first()

      await page.waitForLoadState('networkidle')
      await expect(sidebar).toHaveScreenshot()
    })

    test.skip('users management menu', async ({ page }) => {
      const menu = page.locator('css=main >> xpath=../div[2]')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })

    test.skip('users management table', async ({ page }) => {
      const body = page.locator('main > main')

      await page.waitForLoadState('networkidle')
      await expect(body).toHaveScreenshot()
    })

    test.skip('users management invite', async ({ page }) => {
      const body = page.locator('main > main')
      await body.locator('"Invite"').click()

      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot()
    })
  })

  test.describe('Snapshot base views for Policies', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/project/default/auth/policies')
    })

    test.skip('policies header', async ({ page }) => {
      const header = page.locator('main > div').first()

      await page.waitForLoadState('networkidle')
      await expect(header).toHaveScreenshot()
    })

    test.skip('policies sidebar', async ({ page }) => {
      const sidebar = page.locator('css=main >> xpath=../div[1]').first()

      await page.waitForLoadState('networkidle')
      await expect(sidebar).toHaveScreenshot()
    })

    test.skip('policies menu', async ({ page }) => {
      const menu = page.locator('css=main >> xpath=../div[2]')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })

    test.skip('policies table', async ({ page }) => {
      const body = page.locator('main > main')

      await page.waitForLoadState('networkidle')
      await expect(body).toHaveScreenshot()
    })

    test.skip('policies new', async ({ page }) => {
      const body = page.locator('main > main')
      await body.locator('"New Policy"').click()

      await page.isVisible('[alt="policy-template"]')
      await page.isVisible('[alt="policy-template"]')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot({ threshold: 0.5 })
    })

    test.skip('policies new from template', async ({ page }) => {
      const body = page.locator('main > main')
      await body.locator('"New Policy"').click()

      await page.click('"Get started quickly"')

      await page.isVisible('.active-line-number')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot()
    })

    test.skip('policies new from scratch', async ({ page }) => {
      const body = page.locator('main > main')
      await body.locator('"New Policy"').click()

      await page.click('"For full customization"')

      await page.isVisible('.view-line')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot()
    })
  })

  test.describe('Snapshot base views for templates', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/project/default/auth/templates')
    })

    test.skip('templates header', async ({ page }) => {
      const header = page.locator('main > div').first()

      await page.waitForLoadState('networkidle')
      await expect(header).toHaveScreenshot()
    })

    test.skip('templates sidebar', async ({ page }) => {
      const sidebar = page.locator('css=main >> xpath=../div[1]').first()

      await page.waitForLoadState('networkidle')
      await expect(sidebar).toHaveScreenshot()
    })

    test.skip('templates menu', async ({ page }) => {
      const menu = page.locator('css=main >> xpath=../div[2]')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })

    test.skip('templates body', async ({ page }) => {
      const body = page.locator('main > main')

      await page.waitForLoadState('networkidle')
      await expect(body).toHaveScreenshot()
    })
  })
})
