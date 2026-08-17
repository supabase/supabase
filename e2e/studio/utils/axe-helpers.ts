import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { expect, type Page, type TestInfo } from '@playwright/test'
import type { Result } from 'axe-core'

import {
  annotate,
  attachScanReport,
  blockingViolations as blockingViolationsFor,
  scanExcluding,
  scanLooksEmpty,
  scanRegion,
  shouldEnforceAll,
  unloadedResult as unloadedResultFor,
  WCAG_TAGS,
  type A11yScanResult,
} from '../../shared/a11y.ts'
import { formatViolations, settleForAxe, violationIds } from '../../shared/axe.ts'

// `color-contrast` findings are theme-specific, and Studio's ThemeProvider defaults
// to `system`, so without a pin the theme follows the runner. Dark is unscanned.
export const SCAN_THEME = 'light'

// next-themes is configured to write the resolved theme here, not to a class.
export const THEME_ATTRIBUTE = 'data-theme'

export const THEME_STORAGE_KEY = 'theme'

export const MAIN_SELECTOR = '#main'

export const SIDEBAR_SELECTOR = '[data-sidebar="sidebar"]'

export const HEADER_SELECTOR = 'header'

// Modals, side panels, and popovers are all Radix Dialog/Popover content, which
// carries `role="dialog"`.
export const DIALOG_SELECTOR = '[role="dialog"]'

// axe's include matches every node a selector resolves to, so `[role="menu"]`
// pulled 108 product nav elements into every menu checkpoint.
export const MENU_SELECTOR = '[data-radix-menu-content]'

// `ConfirmationModal` builds on Radix AlertDialog, which is `role="alertdialog"`
// and so is not matched by DIALOG_SELECTOR.
export const ALERT_DIALOG_SELECTOR = '[role="alertdialog"]'

// Radix Select portals its options out of whatever opened it.
export const LISTBOX_SELECTOR = '[role="listbox"]'

// The app shell is identical on every route, so route scans exclude it and it gets
// one pass of its own.
export const SHELL_SELECTORS = [SIDEBAR_SELECTOR, HEADER_SELECTOR]

// Landmark, region, and heading-order rules are axe best practices rather than
// WCAG failures, so the WCAG tags alone would never run them.
export const SCAN_TAGS = [...WCAG_TAGS, 'best-practice']

// Rules that need a rendered node subtree. Every rule the scan reports has to be
// listed here or in STRUCTURE_RULES: the ratchet reads that list to tell a rule
// that dropped to zero from a rule nothing scanned.
export const CONTENT_RULES = [
  'aria-allowed-attr',
  'aria-dialog-name',
  'aria-required-attr',
  'aria-required-children',
  'aria-required-parent',
  'aria-valid-attr-value',
  'button-name',
  'color-contrast',
  'duplicate-id-aria',
  'empty-table-header',
  'heading-order',
  'label',
  'label-title-only',
  'list',
  'listitem',
  'nested-interactive',
  'region',
  'scrollable-region-focusable',
]

// Rules that judge the document as a whole. Inside a region scan they either find
// nothing to match or report against a document that is not there.
export const STRUCTURE_RULES = [
  'landmark-banner-is-top-level',
  'landmark-complementary-is-top-level',
  'landmark-contentinfo-is-top-level',
  'landmark-main-is-top-level',
  'landmark-no-duplicate-banner',
  'landmark-no-duplicate-contentinfo',
  'landmark-no-duplicate-main',
  'landmark-one-main',
  'landmark-unique',
  'page-has-heading-one',
]

// Counted by the ratchet, which reports a growing count as a warning annotation
// rather than a failure.
export const RATCHETED_RULES = [...CONTENT_RULES, ...STRUCTURE_RULES].sort()

// Studio is a single-page app behind one HTML shell, so document-level rules
// would report the same finding on every scan unit.
export const EXCLUDED_RULES = [
  'aria-hidden-body',
  'css-orientation-lock',
  'document-title',
  'html-has-lang',
  'html-lang-valid',
  'html-xml-lang-mismatch',
  'meta-refresh',
  'meta-viewport',
]

// Rules that fail the spec outright. Every one counted zero across all 121 scan
// units, so a failure can only mean a pull request introduced it; a rule that fires
// even once belongs in the ratchet instead, which reports without failing.
// `A11Y_ENFORCE_ALL=1` escalates everything for a local triage run.
export const ENFORCED_RULES: string[] = [
  'duplicate-id-aria',
  'landmark-banner-is-top-level',
  'landmark-complementary-is-top-level',
  'landmark-contentinfo-is-top-level',
  'landmark-no-duplicate-banner',
  'landmark-no-duplicate-contentinfo',
  'landmark-one-main',
  'region',
]

export interface AxeArtifact extends A11yScanResult {
  scannedRules: string[]
  theme: string
}

// A scan that silently fell back to the other theme produces a baseline
// nobody can reproduce.
export async function readTheme(page: Page): Promise<string> {
  return page.evaluate(
    (attribute) => document.documentElement.getAttribute(attribute) ?? 'unknown',
    THEME_ATTRIBUTE
  )
}

export const AXE_RESULTS_DIR = path.resolve(import.meta.dirname, '..', 'axe-results')

export async function scanRoute(page: Page, surface: string): Promise<AxeArtifact> {
  const result = await scanExcluding(page, {
    surface,
    exclude: SHELL_SELECTORS,
    excludeRules: EXCLUDED_RULES,
    tags: SCAN_TAGS,
  })

  return { ...result, scannedRules: RATCHETED_RULES, theme: await readTheme(page) }
}

export async function scanShellRegion(
  page: Page,
  surface: string,
  include: string
): Promise<AxeArtifact> {
  const result = await scanRegion(page, {
    surface,
    include,
    enforcedRules: CONTENT_RULES,
    excludeRules: EXCLUDED_RULES,
    tags: SCAN_TAGS,
  })

  return { ...result, scannedRules: CONTENT_RULES, theme: await readTheme(page) }
}

// Route scans catch a surface at rest, which is every state a dialog is not in.
export async function scanCheckpoint(
  page: Page,
  surface: string,
  include: string
): Promise<AxeArtifact> {
  const result = await scanRegion(page, {
    surface,
    include,
    enforcedRules: CONTENT_RULES,
    excludeRules: EXCLUDED_RULES,
    tags: SCAN_TAGS,
  })

  return { ...result, scannedRules: CONTENT_RULES, theme: await readTheme(page) }
}

export function unloadedResult(
  surface: string,
  url: string,
  status: number | null,
  include: string
): AxeArtifact {
  return {
    ...unloadedResultFor(surface, url, status, include, EXCLUDED_RULES),
    scannedRules: [],
    theme: 'unknown',
  }
}

// Playwright workers write concurrently, so a single shared file would interleave.
export function writeArtifact(result: AxeArtifact): void {
  mkdirSync(AXE_RESULTS_DIR, { recursive: true })
  const name = result.surface.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
  writeFileSync(
    path.join(AXE_RESULTS_DIR, `${name || 'scan'}.json`),
    `${JSON.stringify(result, null, 2)}\n`,
    'utf8'
  )
}

export function blockingViolations(result: AxeArtifact): Result[] {
  return blockingViolationsFor(result, ENFORCED_RULES)
}

// Accessibility findings are annotations, never assertions. The two assertions here
// are about whether the scan itself is usable.
export async function reportScan(
  testInfo: TestInfo,
  result: AxeArtifact,
  scope: string
): Promise<void> {
  writeArtifact(result)
  await attachScanReport(testInfo, result)

  if (scanLooksEmpty(result)) {
    annotate(
      testInfo,
      `${result.surface} scanned only ${result.elementCount} element(s) in ${scope}, so a clean ` +
        'result here proves nothing. Most likely the route rendered an empty state or had not ' +
        'finished mounting.'
    )
  }

  if (result.violations.length) {
    const ratcheted = result.violations.filter((violation) =>
      RATCHETED_RULES.includes(violation.id)
    )
    annotate(
      testInfo,
      `${result.surface} has ${result.violations.length} accessibility finding(s), ` +
        `${ratcheted.length} of them ratcheted: ` +
        result.violations
          .map((violation) => `${violation.id} (${violation.nodes.length})`)
          .join(', ')
    )
  }

  // Not an accessibility finding, so it fails the spec even in warn mode: a scan
  // in the wrong theme produces numbers the baseline cannot be compared against.
  expect(
    result.theme,
    `${result.surface} rendered in the "${result.theme}" theme, but the scan pins "${SCAN_THEME}". ` +
      'Contrast counts are theme-specific, so this run cannot be compared to the baseline.'
  ).toBe(SCAN_THEME)

  const blocking = blockingViolations(result)
  expect(
    violationIds(blocking),
    `${result.surface} has blocking a11y violations:\n${formatViolations(blocking)}`
  ).toEqual([])
}

// `checkpoint` becomes a baseline key and an artifact filename, so it has to be
// unique across every spec: "Table Editor - New Table Panel", not "New Table Panel".
export async function runCheckpointScan(
  page: Page,
  testInfo: TestInfo,
  checkpoint: string,
  include: string = DIALOG_SELECTOR
): Promise<void> {
  await expect(
    page.locator(include).first(),
    `Nothing matching "${include}" was open at checkpoint "${checkpoint}", so there is nothing ` +
      'to scan. Either the surface never opened or it uses a different selector.'
  ).toBeVisible()

  await settleForAxe(page)

  await reportScan(testInfo, await scanCheckpoint(page, checkpoint, include), include)
}

export type { A11yScanResult }
export {
  annotate,
  attachScanReport,
  MIN_MEANINGFUL_ELEMENTS,
  scanLooksEmpty,
  WCAG_TAGS,
} from '../../shared/a11y.ts'
export { shouldEnforceAll }
export { formatViolations, settleForAxe, violationIds } from '../../shared/axe.ts'
