import { AxeBuilder } from '@axe-core/playwright'
import type { Page, TestInfo } from '@playwright/test'
import type { Result } from 'axe-core'

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

export const ENFORCED_RULES = ['heading-order', 'page-has-heading-one']

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

export function unloadedResult(
  surface: string,
  url: string,
  status: number | null,
  include: string
): A11yScanResult {
  return {
    surface,
    url,
    include,
    excludedRules: EXCLUDED_RULES,
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

export function blockingViolations(result: A11yScanResult): Result[] {
  if (shouldEnforceAll()) return result.violations
  return result.violations.filter((violation) => ENFORCED_RULES.includes(violation.id))
}

export { formatViolations, violationIds } from '../../shared/axe.ts'
