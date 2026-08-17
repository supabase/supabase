import { expect, test, type Page, type TestInfo } from '@playwright/test'

import { renderedLocator, VIEWPORTS, type ViewportName } from '../../shared/viewports.ts'
import {
  annotate,
  attachScanReport,
  blockingGlobalElementViolations,
  dedupeViolations,
  formatViolations,
  GLOBAL_ELEMENTS_ENFORCED_RULES,
  scanGlobalElements,
  scanLooksEmpty,
  settleForAxe,
  shouldEnforceAll,
  unloadedGlobalElementsResult,
} from '../utils/axe-helpers.ts'
import {
  GLOBAL_ELEMENT_PAGES,
  GLOBAL_ELEMENTS,
  globalElementsForViewport,
  MOBILE_MENU_SELECTOR,
  type GlobalElement,
} from '../utils/www-global-elements.ts'

// One footer finding would otherwise report once per page per viewport.
const seenFindings = new Set<string>()

async function load(
  page: Page,
  testInfo: TestInfo,
  path: string,
  surface: string
): Promise<number | null> {
  let response
  try {
    response = await page.goto(path)
  } catch (error) {
    await attachScanReport(testInfo, unloadedGlobalElementsResult(surface, path, null))
    throw error
  }

  const status = response?.status() ?? null

  if (!response?.ok()) {
    await attachScanReport(testInfo, unloadedGlobalElementsResult(surface, page.url(), status))
    expect(response?.ok(), `Expected a successful response for ${path}, got ${status}`).toBeTruthy()
  }

  return status
}

async function assertElementsRender(
  page: Page,
  surface: string,
  elements: readonly GlobalElement[],
  viewport: ViewportName
): Promise<void> {
  // Visible, not attached: axe skips hidden subtrees.
  // Soft, so a missing element still reports its scan.
  for (const { selector, label } of globalElementsForViewport(elements, viewport)) {
    await expect
      .soft(renderedLocator(page, selector), `${surface} should render the ${label} (${selector})`)
      .toBeVisible()
  }
}

async function scanAndAssert(
  page: Page,
  testInfo: TestInfo,
  surface: string,
  status: number | null,
  exclude: string[]
): Promise<void> {
  const result = await scanGlobalElements(page, surface, exclude)
  result.status = status
  result.violations = dedupeViolations(result.violations, seenFindings)

  await attachScanReport(testInfo, result)

  if (scanLooksEmpty(result)) {
    annotate(
      testInfo,
      `${surface} scanned only ${result.elementCount} element(s) outside the article, so a clean ` +
        'result here proves nothing. Most likely the page had not finished rendering.'
    )
  }

  const blocking = blockingGlobalElementViolations(result)

  const reported = result.violations.filter((violation) => !blocking.includes(violation))
  if (reported.length) {
    annotate(
      testInfo,
      `${surface} has ${reported.length} non-blocking accessibility finding(s) outside the ` +
        `article: ${reported.map((v) => `${v.id} (${v.nodes.length})`).join(', ')}`
    )
  }

  const enforced = shouldEnforceAll()
    ? 'all WCAG 2.1 A/AA rules'
    : GLOBAL_ELEMENTS_ENFORCED_RULES.join(', ')

  expect(
    blocking.map((violation) => violation.id).sort(),
    `${surface} has blocking a11y violations outside the article (${enforced}):\n` +
      formatViolations(blocking)
  ).toEqual([])
}

test.describe('WWW global elements', () => {
  for (const { path, layout, elements, articleSelector } of GLOBAL_ELEMENT_PAGES) {
    for (const viewport of Object.keys(VIEWPORTS) as ViewportName[]) {
      const surface = `${path} at ${viewport}`

      test(`${surface} (${layout}) has no blocking accessibility violations outside the article @global-elements`, async ({
        page,
      }, testInfo) => {
        await page.setViewportSize(VIEWPORTS[viewport])

        const status = await load(page, testInfo, path, surface)

        await settleForAxe(page)

        if (articleSelector) {
          await expect
            .soft(
              page.locator(articleSelector),
              `${surface} should render the article wrapper (${articleSelector}). Without it the ` +
                'scan widens into content the page suite already covers.'
            )
            .toBeAttached()
        }

        await assertElementsRender(page, surface, elements, viewport)

        await scanAndAssert(
          page,
          testInfo,
          surface,
          status,
          articleSelector ? [articleSelector] : []
        )
      })
    }
  }

  // Same overlay on every page, and its markup only exists once opened.
  test('the mobile menu overlay has no blocking accessibility violations @global-elements', async ({
    page,
  }, testInfo) => {
    const path = '/'
    const surface = '/ with the mobile menu open'

    await page.setViewportSize(VIEWPORTS.mobile)

    const status = await load(page, testInfo, path, surface)

    const trigger = renderedLocator(page, GLOBAL_ELEMENTS.menuTrigger.selector)
    await expect.soft(trigger, `${surface} should render the mobile menu trigger`).toBeVisible()

    // Clicking a trigger that never rendered burns the timeout and reports nothing.
    if (await trigger.count()) {
      await trigger.click()
      await expect
        .soft(page.locator(MOBILE_MENU_SELECTOR), `${surface} should open the mobile menu overlay`)
        .toBeVisible()
    }

    await settleForAxe(page)

    await scanAndAssert(page, testInfo, surface, status, [])
  })
})
