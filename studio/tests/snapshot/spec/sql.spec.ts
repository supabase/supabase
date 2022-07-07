import { test, expect, type Page } from '@playwright/test'
import content from '../stubs/sql.content.json'
import keywords from '../stubs/sql.keywords.json'
import schemas from '../stubs/sql.schemas.json'
import tables from '../stubs/sql.tables.json'
import publicTables from '../stubs/sql.public.json'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })

  // add stub replies from the backend
  await page.route(/content/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(content),
    })
  })

  await page.route(/query/, async (route) => {
    const { query } = route.request().postDataJSON()

    // stub results for the query route, depending on the requested query
    if (query.includes('select * from pg_get_keywords()')) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(keywords),
      })
    } else if (query.includes('SELECT nspname as name')) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(schemas),
      })
    } else if (query.includes('tbl.schemaname')) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(tables),
      })
    } else if (query.includes('SELECT n.nspname')) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(publicTables),
      })
    }
    // stubs for other queries going on, e.g. schemas and views query
    else {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    }
  })
})

test.describe('SQL editor page', () => {
  test('should open sql editor', async ({ page }) => {
    await page.goto('http://localhost:3000/project/default/sql')
    const title = page.locator('h4', { hasText: 'SQL Editor' })

    await expect(title).toBeVisible()
  })

  test.describe('Snapshot base views for sql editor', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/project/default/sql')
    })

    test('sql editor header', async ({ page }) => {
      const header = page.locator('css=.PageHeader >> xpath=..')

      await page.waitForLoadState('networkidle')
      await expect(header).toHaveScreenshot()
    })

    test('sql editor sidebar', async ({ page }) => {
      const sidebar = page.locator('css=main >> xpath=../div[1]')

      await page.waitForLoadState('networkidle')
      await expect(sidebar).toHaveScreenshot()
    })

    test('sql editor menu', async ({ page }) => {
      const menu = page.locator('css=main >> xpath=../div[2]')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })

    test('sql editor with query', async ({ page }) => {
      const body = page.locator('main > .flex')

      await page.waitForLoadState('networkidle')
      await page.locator('css=main >> xpath=../div[2]').click()
      await expect(body).toHaveScreenshot()
    })
  })
})
