import { expect, test } from '@playwright/test'
import type { Page, TestInfo } from '@playwright/test'

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
  elementsForViewport,
  GLOBAL_ELEMENTS,
  GLOBAL_ELEMENT_PAGES,
  MOBILE_MENU_SELECTOR,
  renderedLocator,
  VIEWPORTS,
  type ViewportName,
} from '../utils/docs-global-elements.js'

function annotate(testInfo: TestInfo, description: string) {
  testInfo.annotations.push({ type: 'warning', description })
  console.warn(`::warning title=Accessibility::${description}`)
}

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
  const result = await scanOutsideArticle(page, surface, exclude)
  result.status = status

  await attachScanReport(testInfo, result)

  if (scanLooksEmpty(result)) {
    annotate(
      testInfo,
      `${surface} scanned only ${result.elementCount} element(s) outside the article, so a clean ` +
        'result here proves nothing. Most likely the page had not finished rendering.'
    )
  }

  const blocking = blockingViolations(result, GLOBAL_ELEMENTS_ENFORCED_RULES)

  const reported = result.violations.filter((violation) => !blocking.includes(violation))
  if (reported.length) {
    annotate(
      testInfo,
      `${surface} global elements have ${reported.length} non-blocking accessibility finding(s): ` +
        reported.map((v) => `${v.id} (${v.nodes.length})`).join(', ')
    )
  }

  const enforced = shouldEnforceAll()
    ? 'all WCAG 2.1 A/AA rules'
    : GLOBAL_ELEMENTS_ENFORCED_RULES.join(', ')

  expect(
    blocking.map((violation) => violation.id).sort(),
    `${surface} global elements have blocking a11y violations (${enforced}):\n${formatViolations(blocking)}`
  ).toEqual([])
}

test.describe('Docs global elements', () => {
  for (const { path, layout, elements } of GLOBAL_ELEMENT_PAGES) {
    for (const viewport of Object.keys(VIEWPORTS) as ViewportName[]) {
      const surface = `${path} at ${viewport}`

      test(`${surface} (${layout}) global elements have no blocking accessibility violations @global-elements`, async ({
        page,
      }, testInfo) => {
        test.setTimeout(120_000)

        await page.setViewportSize(VIEWPORTS[viewport])

        const status = await load(page, testInfo, path, surface)

        await settleForAxe(page)

        // Visible, not attached: axe skips hidden subtrees.
        // Soft, so a missing element still reports its scan.
        for (const name of elementsForViewport(elements, viewport)) {
          const { selector, label } = GLOBAL_ELEMENTS[name]
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
    test.setTimeout(120_000)

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
