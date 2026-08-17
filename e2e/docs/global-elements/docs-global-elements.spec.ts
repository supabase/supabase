import { expect, test } from '@playwright/test'
import type { Page, TestInfo } from '@playwright/test'

import {
  annotate,
  attachScanReport,
  blockingViolations,
  dedupeViolations,
  scanExcluding,
  shouldEnforceAll,
  unloadedResult,
} from '../../shared/a11y.ts'
import { formatViolations, settleForAxe, violationIds } from '../../shared/axe.ts'
import { elementsForViewport, renderedLocator, VIEWPORTS } from '../../shared/viewports.ts'
import type { ViewportName } from '../../shared/viewports.ts'
import {
  GLOBAL_ELEMENTS_ENFORCED_RULES,
  GLOBAL_ELEMENTS_EXCLUDED_RULES,
} from '../utils/axe-helpers.js'
import {
  articleSelectorsOnPage,
  GLOBAL_ELEMENT_PAGES,
  GLOBAL_ELEMENTS,
  MOBILE_MENU_SELECTOR,
  type GlobalElement,
} from '../utils/docs-global-elements.js'

// One broken global element would otherwise report on every test that scans it.
const seenFindings = new Set<string>()

async function load(page: Page, testInfo: TestInfo, path: string, surface: string) {
  let response
  try {
    response = await page.goto(path)
  } catch (error) {
    await attachScanReport(
      testInfo,
      unloadedResult(surface, path, null, 'document', GLOBAL_ELEMENTS_EXCLUDED_RULES)
    )
    throw error
  }

  const status = response?.status() ?? null

  if (!response?.ok()) {
    await attachScanReport(
      testInfo,
      unloadedResult(surface, page.url(), status, 'document', GLOBAL_ELEMENTS_EXCLUDED_RULES)
    )
    expect(response?.ok(), `Expected a successful response for ${path}, got ${status}`).toBeTruthy()
  }

  return status
}

async function scanAndAssert(
  page: Page,
  testInfo: TestInfo,
  surface: string,
  status: number | null
) {
  const exclude = await articleSelectorsOnPage(page)
  const result = await scanExcluding(page, {
    surface,
    exclude,
    excludeRules: GLOBAL_ELEMENTS_EXCLUDED_RULES,
  })
  result.status = status
  result.violations = dedupeViolations(result.violations, seenFindings)

  await attachScanReport(testInfo, result)

  const blocking = blockingViolations(result, GLOBAL_ELEMENTS_ENFORCED_RULES)

  const reported = result.violations.filter((violation) => !blocking.includes(violation))
  if (reported.length) {
    annotate(
      testInfo,
      `${surface} global elements have ${reported.length} non-blocking accessibility finding(s): ` +
        reported.map((violation) => `${violation.id} (${violation.nodes.length})`).join(', ')
    )
  }

  const enforced = shouldEnforceAll()
    ? 'all WCAG 2.1 A/AA rules'
    : GLOBAL_ELEMENTS_ENFORCED_RULES.join(', ')

  expect(
    violationIds(blocking).sort(),
    `${surface} global elements have blocking a11y violations (${enforced}):\n${formatViolations(blocking)}`
  ).toEqual([])
}

function configsFor(elements: GlobalElement[], viewport: ViewportName) {
  return elementsForViewport(
    elements.map((name) => GLOBAL_ELEMENTS[name]),
    viewport
  )
}

test.describe('Docs global elements', () => {
  for (const { path, layout, elements } of GLOBAL_ELEMENT_PAGES) {
    for (const viewport of Object.keys(VIEWPORTS) as ViewportName[]) {
      const surface = `${path} at ${viewport}`

      test(`${surface} (${layout}) global elements have no blocking accessibility violations @global-elements`, async ({
        page,
      }, testInfo) => {
        await page.setViewportSize(VIEWPORTS[viewport])

        const status = await load(page, testInfo, path, surface)

        await settleForAxe(page)

        // Visible, not attached: axe skips hidden subtrees.
        // Soft, so a missing element still reports its scan.
        for (const { selector, label } of configsFor(elements, viewport)) {
          await expect
            .soft(
              renderedLocator(page, selector),
              `${surface} should render the ${label} (${selector})`
            )
            .toBeVisible()
        }

        await scanAndAssert(page, testInfo, surface, status)
      })
    }
  }

  // Same overlay on every page, and its markup only exists once opened.
  test('the mobile menu overlay has no blocking accessibility violations @global-elements', async ({
    page,
  }, testInfo) => {
    const path = '/docs'
    const surface = '/docs with the mobile menu open'

    await page.setViewportSize(VIEWPORTS.mobile)

    const status = await load(page, testInfo, path, surface)

    await renderedLocator(page, GLOBAL_ELEMENTS.menuTrigger.selector).click()
    await expect(
      page.locator(MOBILE_MENU_SELECTOR),
      `${surface} should open the mobile menu overlay`
    ).toBeVisible()

    await settleForAxe(page)

    await scanAndAssert(page, testInfo, surface, status)
  })
})
