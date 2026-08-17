import type { Page, TestInfo } from '@playwright/test'
import type { Result } from 'axe-core'

import { scan } from './axe.ts'

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

export const MIN_MEANINGFUL_ELEMENTS = 20

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

export type ScanRegionOptions = {
  surface: string
  include: string
  enforcedRules: string[]
  excludeRules: string[]
  tags?: string[]
}

// Rules and tags are mutually exclusive in one axe run, so this takes two passes.
export async function scanRegion(page: Page, options: ScanRegionOptions): Promise<A11yScanResult> {
  const { surface, include, enforcedRules, excludeRules, tags = WCAG_TAGS } = options

  const reported = await scan(page, { tags, excludeRules, include })
  const enforced = await scan(page, { rules: enforcedRules, include })

  const byRule = new Map([...reported, ...enforced].map((violation) => [violation.id, violation]))

  const elementCount = await page.evaluate(
    (selector) => document.querySelector(selector)?.querySelectorAll('*').length ?? 0,
    include
  )

  return {
    surface,
    url: page.url(),
    include,
    excludedRules: excludeRules,
    loaded: true,
    status: null,
    elementCount,
    violations: [...byRule.values()],
  }
}

export type ScanExcludingOptions = {
  surface: string
  exclude: string[]
  excludeRules: string[]
  tags?: string[]
}

// One tagged pass only, so callers must keep their enforced rules inside `tags`
// or those rules never run.
export async function scanExcluding(
  page: Page,
  options: ScanExcludingOptions
): Promise<A11yScanResult> {
  const { surface, exclude, excludeRules, tags = WCAG_TAGS } = options

  const violations = await scan(page, { tags, excludeRules, exclude })

  const elementCount = await page.evaluate(
    (selectors) =>
      document.body.querySelectorAll('*').length -
      selectors.reduce(
        (sum, selector) =>
          sum +
          [...document.querySelectorAll(selector)].reduce(
            (nodes, root) => nodes + root.querySelectorAll('*').length + 1,
            0
          ),
        0
      ),
    exclude
  )

  return {
    surface,
    url: page.url(),
    include: 'document',
    exclude,
    excludedRules: excludeRules,
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
  include: string,
  excludeRules: string[]
): A11yScanResult {
  return {
    surface,
    url,
    include,
    excludedRules: excludeRules,
    loaded: false,
    status,
    elementCount: 0,
    violations: [],
  }
}

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

export function blockingViolations(result: A11yScanResult, enforcedRules: string[]): Result[] {
  if (shouldEnforceAll()) return result.violations
  return result.violations.filter((violation) => enforcedRules.includes(violation.id))
}

export function annotate(testInfo: TestInfo, description: string): void {
  testInfo.annotations.push({ type: 'warning', description })
  console.warn(`::warning title=Accessibility::${description}`)
}

function findingKey(ruleId: string, target: readonly unknown[]): string {
  return `${ruleId}|${target.join(' ')}`
}

// `seen` is per worker process, and Playwright replaces a worker after a failing
// test, so a finding can still repeat.
export function dedupeViolations(violations: Result[], seen: Set<string>): Result[] {
  const fresh: Result[] = []

  for (const violation of violations) {
    const nodes = violation.nodes.filter((node) => {
      const key = findingKey(violation.id, node.target)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (nodes.length) fresh.push({ ...violation, nodes })
  }

  return fresh
}
