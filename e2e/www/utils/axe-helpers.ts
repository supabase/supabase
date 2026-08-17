import type { Page } from '@playwright/test'
import type { Result } from 'axe-core'

import {
  blockingViolations as blockingViolationsFor,
  scanRegion,
  unloadedResult as unloadedResultFor,
  type A11yScanResult,
} from '../../shared/a11y.ts'
import { scan } from '../../shared/axe.ts'
import { PAGE_SELECTOR } from './www-selectors.ts'

// Outside the wcag2a/wcag2aa tag sweep, so it needs its own pass.
export const EXTRA_REPORTED_RULES = ['heading-order']

// Every template renders its `<h1>` outside the article wrapper, so this runs
// against the page landmark. It passes on all four templates today.
export const ENFORCED_RULES = ['page-has-heading-one']

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

export async function scanArticle(
  page: Page,
  surface: string,
  include: string
): Promise<A11yScanResult> {
  const result = await scanRegion(page, {
    surface,
    include,
    enforcedRules: EXTRA_REPORTED_RULES,
    excludeRules: EXCLUDED_RULES,
  })

  const pageViolations = await scan(page, { rules: ENFORCED_RULES, include: PAGE_SELECTOR })

  return { ...result, violations: [...result.violations, ...pageViolations] }
}

export function unloadedResult(
  surface: string,
  url: string,
  status: number | null,
  include: string
): A11yScanResult {
  return unloadedResultFor(surface, url, status, include, EXCLUDED_RULES)
}

export function blockingViolations(result: A11yScanResult): Result[] {
  return blockingViolationsFor(result, ENFORCED_RULES)
}

export type { A11yScanResult }
export {
  annotate,
  attachScanReport,
  MIN_MEANINGFUL_ELEMENTS,
  scanLooksEmpty,
  shouldEnforceAll,
  WCAG_TAGS,
} from '../../shared/a11y.ts'
export { formatViolations, settleForAxe, violationIds } from '../../shared/axe.ts'
