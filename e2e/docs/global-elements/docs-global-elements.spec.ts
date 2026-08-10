import { expect, test } from '@playwright/test'
import type { TestInfo } from '@playwright/test'

import {
  attachScanReport,
  blockingViolations,
  GLOBAL_ELEMENTS_ENFORCED_RULES,
  GLOBAL_ELEMENTS_EXCLUDED_RULES,
  formatViolations,
  scanLooksEmpty,
  scanOutsideArticle,
  settleForAxe,
  shouldEnforceAll,
  unloadedResult,
} from '../utils/axe-helpers.js'
import {
  articleSelectorsOnPage,
  GLOBAL_ELEMENTS,
  GLOBAL_ELEMENT_PAGES,
} from '../utils/docs-global-elements.js'

function annotate(testInfo: TestInfo, description: string) {
  testInfo.annotations.push({ type: 'warning', description })
  console.warn(`::warning title=Accessibility::${description}`)
}

test.describe('Docs global elements', () => {
  // Without this, every test in this file runs on one worker.
  test.describe.configure({ mode: 'parallel' })

  for (const { path, layout, landmarks } of GLOBAL_ELEMENT_PAGES) {
    test(`${path} (${layout}) global elements have no blocking accessibility violations @global-elements`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(120_000)

      let response
      try {
        response = await page.goto(path)
      } catch (error) {
        await attachScanReport(
          testInfo,
          unloadedResult(path, path, null, 'document', GLOBAL_ELEMENTS_EXCLUDED_RULES)
        )
        throw error
      }

      const status = response?.status() ?? null

      if (!response?.ok()) {
        await attachScanReport(
          testInfo,
          unloadedResult(path, page.url(), status, 'document', GLOBAL_ELEMENTS_EXCLUDED_RULES)
        )
        expect(
          response?.ok(),
          `Expected a successful response for ${path}, got ${status}`
        ).toBeTruthy()
        return
      }

      await settleForAxe(page)

      // Soft, so a missing landmark still reports its scan instead of hiding it.
      for (const landmark of landmarks) {
        const { selector, label } = GLOBAL_ELEMENTS[landmark]
        await expect
          .soft(page.locator(selector).first(), `${path} should render the ${label} (${selector})`)
          .toBeAttached()
      }

      const exclude = await articleSelectorsOnPage(page)
      const result = await scanOutsideArticle(page, path, exclude)
      result.status = status

      await attachScanReport(testInfo, result)

      if (scanLooksEmpty(result)) {
        annotate(
          testInfo,
          `${path} scanned only ${result.elementCount} element(s) outside the article, so a clean ` +
            'result here proves nothing. Most likely the page had not finished rendering.'
        )
      }

      const blocking = blockingViolations(result, GLOBAL_ELEMENTS_ENFORCED_RULES)

      const reported = result.violations.filter((violation) => !blocking.includes(violation))
      if (reported.length) {
        annotate(
          testInfo,
          `${path} global elements have ${reported.length} non-blocking accessibility finding(s): ` +
            reported.map((v) => `${v.id} (${v.nodes.length})`).join(', ')
        )
      }

      const enforced = shouldEnforceAll()
        ? 'all WCAG 2.1 A/AA rules'
        : GLOBAL_ELEMENTS_ENFORCED_RULES.join(', ')

      expect(
        blocking.map((violation) => violation.id).sort(),
        `${path} global elements have blocking a11y violations (${enforced}):\n${formatViolations(blocking)}`
      ).toEqual([])
    })
  }
})
