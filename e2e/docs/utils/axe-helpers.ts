import { AxeBuilder } from '@axe-core/playwright'
import type { Page, TestInfo } from '@playwright/test'
import type { Result } from 'axe-core'

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/**
 * Rules that fail the test rather than only being reported.
 *
 * A ratchet: docs carries enough pre-existing debt that gating on everything
 * would block every PR, so rules join this list once they reach zero. These two
 * got there in the heading-hierarchy milestone.
 */
export const ENFORCED_RULES = ['heading-order', 'page-has-heading-one']

/**
 * Rules skipped when scanning article content.
 *
 * `color-contrast` is 55-60% of scan time and finds nothing inside an article —
 * docs contrast debt lives in shared design tokens and site chrome, neither of
 * which a content change can introduce or fix. The rest target `<html>`,
 * `<head>`, or `<body>` and so cannot fire within an article at all.
 *
 * `bypass` needs no entry: axe skips page-level rules whenever an include
 * selector is used.
 */
export const LEAN_EXCLUDED_RULES = [
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
  /** Recorded separately so a 404 isn't reported as an a11y failure. */
  loaded: boolean
  status: number | null
  /** Guards against scanning before hydration, which reads as clean. */
  elementCount: number
  /** Axe's native shape, so `failureSummary` and check data survive. */
  violations: Result[]
}

export function shouldEnforceAll(): boolean {
  return !!process.env.A11Y_ENFORCE_ALL
}

/**
 * Wait for the page to stop changing before scanning.
 *
 * Docs embeds widgets that render more DOM after first paint (the SQL-to-REST
 * translator, the realtime limits estimator). Scanning mid-hydration produced
 * results that flipped between runs on identical code during the
 * heading-hierarchy work.
 */
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
  // Legacy mode skips cross-origin frames. Without it, Playwright hands axe every
  // frame and embedded YouTube players get scanned, reporting YouTube's own
  // markup as ours — on a page with one embed that was 11 of 15 violations.
  // `frame-title` still fires, since the `<iframe>` we render is in our document.
  //
  // Note axe's `iframes: false` run option does not do this: the Playwright
  // integration enumerates frames itself rather than relying on axe's traversal.
  const { violations } = await new AxeBuilder({ page })
    .setLegacyMode(true)
    .withTags(WCAG_TAGS)
    .include(include)
    .disableRules(LEAN_EXCLUDED_RULES)
    .analyze()

  const elementCount = await page.evaluate(
    (selector) => document.querySelector(selector)?.querySelectorAll('*').length ?? 0,
    include
  )

  return {
    surface,
    url: page.url(),
    include,
    excludedRules: LEAN_EXCLUDED_RULES,
    loaded: true,
    status: null,
    elementCount,
    violations,
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
    excludedRules: LEAN_EXCLUDED_RULES,
    loaded: false,
    status,
    elementCount: 0,
    violations: [],
  }
}

export const MIN_MEANINGFUL_ELEMENTS = 20

export function assertMeaningfulScan(
  result: A11yScanResult,
  minElements: number = MIN_MEANINGFUL_ELEMENTS
): void {
  if (result.elementCount >= minElements) return
  throw new Error(
    `${result.surface} scanned only ${result.elementCount} element(s) within ` +
      `${result.include} (expected at least ${minElements}) — the content almost certainly had ` +
      `not rendered yet, so this result is not trustworthy. Investigate rather than treating it ` +
      `as clean.`
  )
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
