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

// These pass today, so enforcing them only catches a newly introduced violation.
// They must sit within WCAG_TAGS, since scanExcluding makes one tagged pass.
export const GLOBAL_ELEMENTS_ENFORCED_RULES = [
  'aria-allowed-attr',
  'aria-deprecated-role',
  'aria-hidden-focus',
  'aria-roles',
  'aria-valid-attr',
  'bypass',
  'document-title',
  'html-has-lang',
  'html-lang-valid',
  'image-alt',
  'link-name',
  'meta-viewport',
  'nested-interactive',
]

// `page-has-heading-one` targets the excluded article.
export const GLOBAL_ELEMENTS_EXCLUDED_RULES = ['page-has-heading-one']

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
