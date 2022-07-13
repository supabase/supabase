import { test, expect, type Page } from '@playwright/test'
import tables from '../stubs/tables.json'
import schemas from '../stubs/schemas.json'
import results from '../stubs/results.json'
import filteredResults from '../stubs/results.filtered.json'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 })

  // add stub replies from the backend
  await page.route(/tables/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(tables),
    })
  })
  await page.route(/schemas/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(schemas),
    })
  })
  await page.route(/query/, async (route) => {
    const { query } = route.request().postDataJSON()

    // stub results for the query route, depending on the requested query
    // stubs for query with filters
    if (query.includes("select count(*) from public.results where status = 'passed';")) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{ count: 54 }]),
      })
    } else if (query.includes("select * from public.results where status = 'passed'")) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(filteredResults),
      })
    }
    // stubs for query without filters
    else if (query.includes('select count(*) from public.results;')) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{ count: 714 }]),
      })
    } else if (query.includes('select * from public.results')) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(results),
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

  // open table editor page
  await page.goto('http://localhost:3000/project/default/editor')
})

test.describe('Table editor', () => {
  test('should open table editor', async ({ page }) => {
    const title = page.locator('h4', { hasText: 'Table editor' })
    await expect(title).toBeVisible()
  })

  test.describe('Snapshot base views for table editor', () => {
    test('table editor header', async ({ page }) => {
      const header = page.locator('css=.PageHeader >> xpath=..')

      await page.waitForLoadState('networkidle')
      await expect(header).toHaveScreenshot()
    })

    test('table editor sidebar', async ({ page }) => {
      const sidebar = page.locator('css=main >> xpath=../div[1]')

      await page.waitForLoadState('networkidle')
      await expect(sidebar).toHaveScreenshot()
    })

    test('table editor menu', async ({ page }) => {
      const menu = page.locator('css=main >> xpath=../div[2]')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })

    test('table editor select or create table', async ({ page }) => {
      const body = page.locator('main > .flex')

      await page.waitForLoadState('networkidle')
      await expect(body).toHaveScreenshot()
    })

    test('table editor stub table', async ({ page }) => {
      await page.waitForLoadState('networkidle')
      await page.goto('http://localhost:3000/project/default/editor/17182')
      const body = page.locator('main > .flex')

      await page.waitForLoadState('networkidle')
      await expect(body).toHaveScreenshot()
    })
  })

  test.describe('Snapshot table editor menu interactions', () => {
    test('table editor search table', async ({ page }) => {
      const search = page.locator('input[placeholder="Search for a table"]')
      await search.type('l')
      const menu = page.locator('css=main >> xpath=../div[2]')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })

    test('table editor search table not found', async ({ page }) => {
      const menu = page.locator('css=main >> xpath=../div[2]')
      const search = menu.locator('input[placeholder="Search for a table"]')
      await search.type('asd')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })

    test('table editor change schema', async ({ page }) => {
      const menu = page.locator('css=main >> xpath=../div[2]')
      await page.click('#headlessui-listbox-button-1')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })

    test('table editor select auth schema', async ({ page }) => {
      const menu = page.locator('css=main >> xpath=../div[2]')
      await page.click('#headlessui-listbox-button-1')
      await page.click('"auth"')

      await page.waitForLoadState('networkidle')
      await expect(menu).toHaveScreenshot()
    })
  })

  test.describe('Snapshot table editor table interactions', () => {
    test.beforeEach(async ({ page }) => {
      // wait for previous url to be fully open and open results table
      await page.waitForLoadState('networkidle')
      await page.goto('http://localhost:3000/project/default/editor/17182')
    })

    test('table editor filters', async ({ page }) => {
      const body = page.locator('main > .flex')
      await body.locator('"Filter"').click()

      await page.waitForLoadState('networkidle')
      await expect(body).toHaveScreenshot()
    })

    test('table editor add filters', async ({ page }) => {
      const body = page.locator('main > .flex')
      await body.locator('"Filter"').click()

      const filters = page.locator('[data-radix-popper-content-wrapper]')
      await filters.locator('"Add filter"').click()
      await filters.locator('"id"').click()
      await filters.locator('"status"').click()

      const filteredRequests = Promise.all([
        page.waitForResponse((r) =>
          r
            .request()
            .postDataJSON()
            ?.query?.includes("select * from public.results where status = 'passed'")
        ),
        page.waitForResponse((r) =>
          r
            .request()
            .postDataJSON()
            ?.query?.includes("select count(*) from public.results where status = 'passed'")
        ),
      ])

      await filters.locator('input').fill('passed')

      // waiting for the filter to be applied and new query requests to be sent
      await filteredRequests

      // to remove focus from input for sure
      await filters.click()

      await page.waitForLoadState('networkidle')
      await expect(body).toHaveScreenshot()
    })
  })
})
