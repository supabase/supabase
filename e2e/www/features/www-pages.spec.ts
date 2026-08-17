import { expect, test } from '@playwright/test'

import { parsePagePaths } from '../../shared/paths.ts'
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
} from '../utils/axe-helpers.ts'
import { wwwArticleSelectorForPagePath } from '../utils/www-selectors.ts'

const pagePaths = parsePagePaths(process.env.WWW_E2E_PAGE_PATHS)

test.describe('WWW content pages', () => {
  test('resolved page list must not be empty', () => {
    expect(
      pagePaths.length,
      'No pages to test. `pnpm e2e:www` resolves pages from git changes by default, ' +
        'or set WWW_E2E_PAGE_PATHS explicitly.'
    ).toBeGreaterThan(0)
  })

  for (const pagePath of pagePaths) {
    test(`${pagePath} has no blocking accessibility violations @a11y`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(120_000)

      const include = wwwArticleSelectorForPagePath(pagePath)

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
        `No article matching "${include}" on ${pagePath}. This suite covers blog posts, ` +
          'events, customer stories, and alternatives; other routes have no article element to scan.'
      ).toBeVisible()

      const result = await scanArticle(page, pagePath, include)
      result.status = status

      await attachScanReport(testInfo, result)

      if (scanLooksEmpty(result)) {
        annotate(
          testInfo,
          `${pagePath} scanned only ${result.elementCount} element(s) in ${include}, so a clean ` +
            'result here proves nothing. Either the page had not finished rendering, or this ' +
            'template renders a short article.'
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
