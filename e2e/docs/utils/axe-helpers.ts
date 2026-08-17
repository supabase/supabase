import type { Page } from '@playwright/test'
import type { Result } from 'axe-core'

import {
  blockingViolations as blockingViolationsFor,
  scanRegion,
  unloadedResult as unloadedResultFor,
  type A11yScanResult,
} from '../../shared/a11y.ts'

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

export async function scanArticle(
  page: Page,
  surface: string,
  include: string
): Promise<A11yScanResult> {
  return scanRegion(page, {
    surface,
    include,
    enforcedRules: ENFORCED_RULES,
    excludeRules: EXCLUDED_RULES,
  })
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
