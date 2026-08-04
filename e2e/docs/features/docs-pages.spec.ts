import { expect, test } from '@playwright/test'

import {
  assertMeaningfulScan,
  attachScanReport,
  blockingViolations,
  ENFORCED_RULES,
  formatViolations,
  scanArticle,
  settleForAxe,
  shouldEnforceAll,
  unloadedResult,
} from '../utils/axe-helpers.js'
import {
  articleSelectorForPagePath,
  browserLikeUserAgent,
  collectDocsOwnedLinks,
  parseDocsE2EPagePaths,
} from '../utils/docs-links.js'

const pagePaths = parseDocsE2EPagePaths(process.env.DOCS_E2E_PAGE_PATHS)

test.describe('Docs owned pages', () => {
  // playwright.config.ts sets fullyParallel: false, and Playwright shards
  // work by file rather than by test in that mode — without this, every test
  // in this single spec file runs on one worker no matter what --workers is
  // passed. Opt this describe block into parallel scheduling explicitly.
  test.describe.configure({ mode: 'parallel' })

  test('resolved page list must not be empty', () => {
    expect(
      pagePaths.length,
      'No pages to test. `pnpm e2e:docs` resolves pages from git changes by default, ' +
        'or set DOCS_E2E_PAGE_PATHS explicitly.'
    ).toBeGreaterThan(0)
  })

  for (const pagePath of pagePaths) {
    test(`${pagePath} loads and docs-owned article links resolve`, async ({ page }, testInfo) => {
      const baseURL = testInfo.project.use.baseURL
      expect(baseURL, 'A Playwright base URL should be configured').toBeTruthy()

      const articleSelector = articleSelectorForPagePath(pagePath)
      const response = await page.goto(pagePath)
      expect(response, `Expected a response for ${pagePath}`).not.toBeNull()
      expect(
        response!.ok(),
        `Page should return a successful status, got ${response!.status()}`
      ).toBeTruthy()

      const article = page.locator(articleSelector)
      await expect(article, 'Page article should be present').toBeVisible()

      const links = await collectDocsOwnedLinks(page, baseURL!, articleSelector)
      const userAgent = await browserLikeUserAgent(page)

      for (const url of links) {
        try {
          const linkResponse = await page.request.get(url, { headers: { 'user-agent': userAgent } })
          expect
            .soft(linkResponse.ok(), `${url} should resolve (status ${linkResponse.status()})`)
            .toBeTruthy()
        } catch (error) {
          expect
            .soft(
              null,
              `${url} should be reachable (${error instanceof Error ? error.message : error})`
            )
            .toBeTruthy()
        }
      }
    })
  }

  for (const pagePath of pagePaths) {
    test(`${pagePath} meets WCAG 2.1 A/AA @a11y`, async ({ page }, testInfo) => {
      // A full WCAG scan is heavier than the two heading rules this test used to
      // run. The link check above keeps the config's 60s.
      test.setTimeout(120_000)

      const include = articleSelectorForPagePath(pagePath)
      const response = await page.goto(pagePath)
      const status = response?.status() ?? null

      // Record load failures as load failures — otherwise a 404 reports as an
      // a11y problem and hides the page's real a11y state.
      if (!response?.ok()) {
        await attachScanReport(testInfo, unloadedResult(pagePath, page.url(), status, include))
        expect(
          response?.ok(),
          `Expected a successful response for ${pagePath}, got ${status}`
        ).toBeTruthy()
        return
      }

      await settleForAxe(page)

      // Axe's own failure here is a bare "No elements found for include in page
      // Context", which says nothing about the cause.
      await expect(
        page.locator(include),
        `No article matching "${include}" on ${pagePath}. This suite covers guides and ` +
          'troubleshooting entries; other routes have no article element to scan.'
      ).toBeVisible()

      const result = await scanArticle(page, pagePath, include)
      result.status = status

      await attachScanReport(testInfo, result)
      assertMeaningfulScan(result)

      const blocking = blockingViolations(result)
      const enforced = shouldEnforceAll() ? 'all WCAG 2.1 A/AA rules' : ENFORCED_RULES.join(', ')

      expect(
        blocking,
        `${pagePath} has blocking a11y violations (${enforced}):\n${formatViolations(blocking)}`
      ).toEqual([])
    })
  }
})
