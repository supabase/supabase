import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
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
 * Rules skipped in `article` scope.
 *
 * `color-contrast` is 55-60% of scan time and found nothing article-scoped on
 * any page sampled — docs contrast debt lives entirely in shared chrome, which
 * the exhaustive run measures once. The rest target `<html>`, `<head>`, or
 * `<body>` and so cannot fire inside an article at all.
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

export type A11yScope = 'article' | 'page'

export interface A11ySurfaceResult {
  surface: string
  url: string
  area: string
  /**
   * Which rule set applies and whether violations block. Independent of
   * `include` — a chrome overlay uses the complete rule set while still
   * targeting one element.
   */
  scope: A11yScope
  include: string | null
  excludedRules: string[]
  /** Recorded separately so a 404 isn't reported as an a11y failure. */
  loaded: boolean
  status: number | null
  /** Guards against scanning before hydration, which reads as clean. */
  elementCount: number
  /** Axe's native shape, so `failureSummary` and contrast check data survive. */
  violations: Result[]
}

const RESULTS_DIR = process.env.A11Y_RESULTS_DIR
  ? path.resolve(process.env.A11Y_RESULTS_DIR)
  : path.resolve(import.meta.dirname, '../a11y-results')

export function resolveScope(): A11yScope {
  return process.env.A11Y_SCOPE === 'page' ? 'page' : 'article'
}

export function shouldEnforceAll(): boolean {
  return !!process.env.A11Y_ENFORCE_ALL
}

export function surfaceSlug(surface: string): string {
  return (
    surface
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'surface'
  )
}

/** Guides group by top-level section so the by-area table stays readable. */
export function areaForSurface(surface: string): string {
  if (!surface.startsWith('/')) return `chrome/${surface}`
  if (surface === '/docs') return 'home'
  if (surface.startsWith('/docs/reference')) return 'reference'
  if (surface.startsWith('/docs/guides/troubleshooting')) return 'troubleshooting'

  const guidesMatch = surface.match(/^\/docs\/guides\/([^/]+)(\/.*)?$/)
  if (guidesMatch) {
    return guidesMatch[2] ? `guides/${guidesMatch[1]}` : 'guides'
  }

  return 'other'
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

export async function scanSurface(
  page: Page,
  surface: string,
  options: { include?: string; scope?: A11yScope; area?: string } = {}
): Promise<A11ySurfaceResult> {
  const scope = options.scope ?? resolveScope()
  const excludedRules = scope === 'article' ? LEAN_EXCLUDED_RULES : []

  // Legacy mode skips cross-origin frames. Without it, Playwright hands axe every
  // frame and embedded YouTube players get scanned, reporting YouTube's own
  // markup as ours — 73 elements across three rules in the first full run.
  // `frame-title` still fires, since the `<iframe>` we render is in our document.
  //
  // Note axe's `iframes: false` run option does not do this: the Playwright
  // integration enumerates frames itself rather than relying on axe's traversal.
  let builder = new AxeBuilder({ page }).setLegacyMode(true).withTags(WCAG_TAGS)
  if (options.include) builder = builder.include(options.include)
  if (excludedRules.length) builder = builder.disableRules(excludedRules)

  const { violations } = await builder.analyze()

  const elementCount = await page.evaluate(
    (selector) =>
      (selector ? document.querySelector(selector) : document.body)?.querySelectorAll('*').length ??
      0,
    options.include ?? null
  )

  return {
    surface,
    url: page.url(),
    area: options.area ?? areaForSurface(surface),
    scope,
    include: options.include ?? null,
    excludedRules,
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
  scope: A11yScope = resolveScope()
): A11ySurfaceResult {
  return {
    surface,
    url,
    area: areaForSurface(surface),
    scope,
    include: null,
    excludedRules: scope === 'article' ? LEAN_EXCLUDED_RULES : [],
    loaded: false,
    status,
    elementCount: 0,
    violations: [],
  }
}

/** Floor for a whole page or article. Small scoped components pass their own. */
export const MIN_MEANINGFUL_ELEMENTS = 20

export function assertMeaningfulScan(
  result: A11ySurfaceResult,
  minElements: number = MIN_MEANINGFUL_ELEMENTS
): void {
  if (result.elementCount >= minElements) return
  throw new Error(
    `${result.surface} scanned only ${result.elementCount} element(s) within ` +
      `${result.include ?? 'the document'} (expected at least ${minElements}) — the content ` +
      `almost certainly had not rendered yet, so this result is not trustworthy. Investigate ` +
      `rather than treating it as clean.`
  )
}

/**
 * One file per surface: parallel workers never contend, and a partial run is
 * resumable by re-running whatever is missing. Written via a temp file so a
 * killed run can't leave truncated JSON for the summarizer.
 */
export function writeSurfaceResult(result: A11ySurfaceResult): void {
  mkdirSync(RESULTS_DIR, { recursive: true })

  const target = path.join(RESULTS_DIR, `${surfaceSlug(result.surface)}.json`)
  const temp = `${target}.tmp`
  writeFileSync(temp, `${JSON.stringify(result, null, 2)}\n`)
  renameSync(temp, target)
}

export async function attachSurfaceReport(
  testInfo: TestInfo,
  result: A11ySurfaceResult
): Promise<void> {
  await testInfo.attach(`axe-${surfaceSlug(result.surface)}.json`, {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  })
}

export function blockingViolations(result: A11ySurfaceResult): Result[] {
  if (shouldEnforceAll()) return result.violations
  // Page scope is a diagnostic capture: reports everything, fails on nothing.
  if (result.scope === 'page') return []
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

export { RESULTS_DIR }
