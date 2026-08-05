import { expect, test } from '@playwright/test'
import type { TestInfo } from '@playwright/test'

import {
  attachScanReport,
  blockingViolations,
  ENFORCED_RULES,
  formatViolations,
  scanArticle,
  scanLooksEmpty,
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

/** `::warning` puts it on the run without failing it, as the lint ratchet does. */
function annotate(testInfo: TestInfo, description: string) {
  testInfo.annotations.push({ type: 'warning', description })
  console.warn(`::warning title=Accessibility::${description}`)
}

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
    // Named for what it asserts, not what it scans. It reports the whole WCAG
    // 2.1 A/AA set but only fails on ENFORCED_RULES, and a failure listed by CI
    // is always something to fix.
    test(`${pagePath} has no blocking accessibility violations @a11y`, async ({
      page,
    }, testInfo) => {
      // Above the config's 60s, which a full WCAG scan can exceed on a long page.
      test.setTimeout(120_000)

      const include = articleSelectorForPagePath(pagePath)

      // goto throws outright on a network, DNS, or TLS failure, so the result has
      // to be recorded here too or the page vanishes from the summary entirely.
      let response
      try {
        response = await page.goto(pagePath)
      } catch (error) {
        await attachScanReport(testInfo, unloadedResult(pagePath, pagePath, null, include))
        throw error
      }

      const status = response?.status() ?? null

      // Fail on the response, not on axe, so a 404 isn't reported as an a11y bug.
      if (!response?.ok()) {
        await attachScanReport(testInfo, unloadedResult(pagePath, page.url(), status, include))
        expect(
          response?.ok(),
          `Expected a successful response for ${pagePath}, got ${status}`
        ).toBeTruthy()
        return
      }

      await settleForAxe(page)

      // Axe's own error for a missing include is "No elements found for include
      // in page Context", which doesn't say which selector or page.
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

      // Rules outside ENFORCED_RULES don't fail, so a GitHub annotation is the
      // only place their findings show up. Matches how the lint ratchet reports.
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
        blocking,
        `${pagePath} has blocking a11y violations (${enforced}):\n${formatViolations(blocking)}`
      ).toEqual([])
    })
  }
})
