import { parsePagePaths } from '../../shared/paths.ts'
import { expect, test } from '../../shared/test.ts'
import {
  annotate,
  attachScanReport,
  blockingViolations,
  ENFORCED_RULES,
  formatViolations,
  scanArticle,
  scanLooksEmpty,
  settleForAxe,
  shouldEnforceAll,
  unloadedResult,
  violationIds,
} from '../utils/axe-helpers.js'
import {
  articleSelectorForPagePath,
  browserLikeUserAgent,
  collectDocsOwnedLinks,
} from '../utils/docs-links.js'

const pagePaths = parsePagePaths(process.env.DOCS_E2E_PAGE_PATHS)

test.describe('Docs owned pages', () => {
  // Without this, every test in this file runs on one worker.
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
    test(`${pagePath} has no blocking accessibility violations @a11y`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(120_000)

      const include = articleSelectorForPagePath(pagePath)

      let response
      try {
        response = await page.goto(pagePath)
      } catch (error) {
        await attachScanReport(testInfo, unloadedResult(pagePath, pagePath, null, include))
        throw error
      }

      const status = response?.status() ?? null

      if (!response?.ok()) {
        await attachScanReport(testInfo, unloadedResult(pagePath, page.url(), status, include))
        expect(
          response?.ok(),
          `Expected a successful response for ${pagePath}, got ${status}`
        ).toBeTruthy()
        return
      }

      await settleForAxe(page)

      await expect(
        page.locator(include),
        `No article matching "${include}" on ${pagePath}. This suite covers guides and ` +
          'troubleshooting entries; other routes have no article element to scan.'
      ).toBeVisible()

      const result = await scanArticle(page, pagePath, include)
      result.status = status

      await attachScanReport(testInfo, result)

      if (scanLooksEmpty(result)) {
        annotate(
          testInfo,
          `${pagePath} scanned only ${result.elementCount} element(s) in ${include}, so a clean ` +
            'result here proves nothing. Most likely the page had not finished rendering.'
        )
      }

      const blocking = blockingViolations(result)

      const reported = result.violations.filter((violation) => !blocking.includes(violation))
      if (reported.length) {
        annotate(
          testInfo,
          `${pagePath} has ${reported.length} non-blocking accessibility finding(s): ` +
            reported.map((v) => `${v.id} (${v.nodes.length})`).join(', ')
        )
      }

      const enforced = shouldEnforceAll() ? 'all WCAG 2.1 A/AA rules' : ENFORCED_RULES.join(', ')

      expect(
        violationIds(blocking),
        `${pagePath} has blocking a11y violations (${enforced}):\n${formatViolations(blocking)}`
      ).toEqual([])
    })
  }
})
