import { expect, test } from '@playwright/test'

// A headless UA trips the isbot check in apps/docs/middleware.ts, which routes
// SDK reference requests to /api/crawlers instead of the page.
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

// Each section's latest version, which is served unversioned.
const REFERENCE_PATHS = [
  'api',
  'javascript',
  'dart',
  'python',
  'kotlin',
  'swift',
  'csharp',
  'server',
  'cli',
  'self-hosting-analytics',
  'self-hosting-auth',
  'self-hosting-functions',
  'self-hosting-realtime',
  'self-hosting-storage',
]

test.describe('Reference pages', () => {
  test.describe.configure({ mode: 'parallel' })
  test.use({ userAgent: BROWSER_UA })
  test.skip(
    ({ baseURL }) => !baseURL || new URL(baseURL).hostname === 'localhost',
    'reference pages are too slow to compile against a dev server'
  )

  for (const path of REFERENCE_PATHS) {
    test(`/reference/${path} loads with content`, async ({ page }) => {
      const response = await page.goto(`/docs/reference/${path}`)
      expect(response?.status(), `expected 200 for ${path}`).toBe(200)

      const article = page.locator('article').first()
      await expect(article).toBeVisible()
      await expect(article.getByRole('heading').first()).toBeVisible()
    })
  }
})
