import { AxeBuilder } from '@axe-core/playwright'
import type { Page, TestInfo } from '@playwright/test'
import type { Result } from 'axe-core'

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

export const ENFORCED_RULES = ['heading-order', 'page-has-heading-one']

// A violation in a global element lands on every docs page, so keep this list
// green rather than growing it with findings that aren't fixed yet.
export const GLOBAL_ELEMENTS_ENFORCED_RULES = ['link-name']

// Page-level rules stay on here, unlike the article scan, which can't reach
// them. Only `page-has-heading-one` goes: its target is the excluded article.
export const GLOBAL_ELEMENTS_EXCLUDED_RULES = ['page-has-heading-one']

export const EXCLUDED_RULES = [
  'color-contrast',
  'html-has-lang',
  'html-lang-valid',
  'html-xml-lang-mismatch',
  'document-title',
  'aria-hidden-body',
  'meta-viewport',
  'meta-refresh',
  'css-orientation-lock',
]

export interface A11yScanResult {
  surface: string
  url: string
  include: string
  exclude?: string[]
  excludedRules: string[]
  loaded: boolean
  status: number | null
  elementCount: number
  violations: Result[]
}

export function shouldEnforceAll(): boolean {
  return !!process.env.A11Y_ENFORCE_ALL
}

export async function settleForAxe(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})

  await page
    .evaluate(
      ({ quietMs, capMs }) =>
        new Promise<void>((resolve) => {
          let timer: ReturnType<typeof setTimeout>
          const observer = new MutationObserver(() => {
            clearTimeout(timer)
            timer = setTimeout(finish, quietMs)
          })

          function finish() {
            clearTimeout(cap)
            clearTimeout(timer)
            observer.disconnect()
            resolve()
          }

          const cap = setTimeout(finish, capMs)
          timer = setTimeout(finish, quietMs)
          observer.observe(document.body, { subtree: true, childList: true, attributes: true })
        }),
      { quietMs: 500, capMs: 5_000 }
    )
    .catch(() => {})
}

export async function scanArticle(
  page: Page,
  surface: string,
  include: string
): Promise<A11yScanResult> {
  const scan = () => new AxeBuilder({ page }).setLegacyMode(true).include(include)

  const reported = await scan().withTags(WCAG_TAGS).disableRules(EXCLUDED_RULES).analyze()

  const enforced = await scan().withRules(ENFORCED_RULES).analyze()

  const byRule = new Map(
    [...reported.violations, ...enforced.violations].map((violation) => [violation.id, violation])
  )

  const elementCount = await page.evaluate(
    (selector) => document.querySelector(selector)?.querySelectorAll('*').length ?? 0,
    include
  )

  return {
    surface,
    url: page.url(),
    include,
    excludedRules: EXCLUDED_RULES,
    loaded: true,
    status: null,
    elementCount,
    violations: [...byRule.values()],
  }
}

export async function scanOutsideArticle(
  page: Page,
  surface: string,
  exclude: string[]
): Promise<A11yScanResult> {
  const scan = () =>
    exclude.reduce(
      (builder, selector) => builder.exclude(selector),
      new AxeBuilder({ page }).setLegacyMode(true)
    )

  const reported = await scan()
    .withTags(WCAG_TAGS)
    .disableRules(GLOBAL_ELEMENTS_EXCLUDED_RULES)
    .analyze()

  const enforced = await scan().withRules(GLOBAL_ELEMENTS_ENFORCED_RULES).analyze()

  const byRule = new Map(
    [...reported.violations, ...enforced.violations].map((violation) => [violation.id, violation])
  )

  const elementCount = await page.evaluate(
    (selectors) =>
      document.body.querySelectorAll('*').length -
      selectors.reduce(
        (sum, selector) =>
          sum + (document.querySelector(selector)?.querySelectorAll('*').length ?? 0) + 1,
        0
      ),
    exclude
  )

  return {
    surface,
    url: page.url(),
    include: 'document',
    exclude,
    excludedRules: GLOBAL_ELEMENTS_EXCLUDED_RULES,
    loaded: true,
    status: null,
    elementCount,
    violations: [...byRule.values()],
  }
}

export function unloadedResult(
  surface: string,
  url: string,
  status: number | null,
  include: string,
  excludedRules: string[] = EXCLUDED_RULES
): A11yScanResult {
  return {
    surface,
    url,
    include,
    excludedRules,
    loaded: false,
    status,
    elementCount: 0,
    violations: [],
  }
}

export const MIN_MEANINGFUL_ELEMENTS = 20

export function scanLooksEmpty(
  result: A11yScanResult,
  minElements: number = MIN_MEANINGFUL_ELEMENTS
): boolean {
  return result.elementCount < minElements
}

export async function attachScanReport(testInfo: TestInfo, result: A11yScanResult): Promise<void> {
  await testInfo.attach('axe-results.json', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  })
}

export function blockingViolations(
  result: A11yScanResult,
  enforcedRules: string[] = ENFORCED_RULES
): Result[] {
  if (shouldEnforceAll()) return result.violations
  return result.violations.filter((violation) => enforcedRules.includes(violation.id))
}

export function formatViolations(violations: Result[]): string {
  return violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}, ${violation.nodes.length} node(s)): ${violation.help}\n` +
        violation.nodes
          .slice(0, 5)
          .map((node) => `    ${node.target.join(' ')}\n      ${node.html.slice(0, 200)}`)
          .join('\n')
    )
    .join('\n')
}
