import { expect, test } from '@playwright/test'
import type { Page, TestInfo } from '@playwright/test'

import {
  assertMeaningfulScan,
  attachSurfaceReport,
  resolveScope,
  scanSurface,
  settleForAxe,
  writeSurfaceResult,
} from '../utils/axe-helpers.js'

/**
 * Overlay surfaces the per-page loop can't reach, plus the docs home.
 *
 * Exhaustive-run only: shared chrome doesn't change per PR, so re-scanning it on
 * every changed page would be noise.
 *
 * `/docs/reference/*` is deliberately absent, matching the rest of this suite.
 * Those routes render client-side into ~32k elements, where axe exceeds 30s and
 * an early scan reports `html-has-lang` purely because `<html lang>` isn't set
 * yet — then passes once hydrated. Tracked as a coverage gap instead.
 */

const HOST_PAGE = '/docs/guides/getting-started'

async function captureSurface(
  page: Page,
  testInfo: TestInfo,
  surface: string,
  options: {
    include?: string
    area?: string
    status?: number | null
    minElements?: number
  } = {}
) {
  const result = await scanSurface(page, surface, { ...options, scope: 'page' })
  result.status = options.status ?? null
  writeSurfaceResult(result)
  await attachSurfaceReport(testInfo, result)
  assertMeaningfulScan(result, options.minElements)
  return result
}

test.describe('Docs chrome and overlays @a11y', () => {
  test.describe.configure({ mode: 'parallel' })

  test.skip(
    () => resolveScope() !== 'page',
    'Chrome surfaces are captured only by the exhaustive run (pnpm e2e:docs:a11y:all).'
  )

  test.beforeEach(() => {
    test.setTimeout(120_000)
  })

  test('docs home', async ({ page }, testInfo) => {
    const response = await page.goto('/docs')
    expect(response?.ok(), `Expected /docs to load, got ${response?.status()}`).toBeTruthy()
    await settleForAxe(page)

    await captureSurface(page, testInfo, '/docs', { status: response?.status() ?? null })
  })

  test('command menu', async ({ page }, testInfo) => {
    await page.goto(HOST_PAGE)
    await settleForAxe(page)

    // Renders twice (mobile and desktop variants) with no test id.
    await page
      .locator('button')
      .filter({ hasText: 'Search docs' })
      .filter({ visible: true })
      .first()
      .click()

    const dialog = page.locator('[role="dialog"][data-state="open"]')
    await expect(dialog, 'Command menu dialog should open').toBeVisible()
    await expect(page.locator('[cmdk-input]'), 'Command menu input should render').toBeVisible()
    await settleForAxe(page)

    // Dialog alone — surrounding chrome is already counted on every page.
    await captureSurface(page, testInfo, 'Command menu', {
      include: '[role="dialog"][data-state="open"]',
      area: 'chrome/command-menu',
    })
  })

  test('mobile navigation drawer', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(HOST_PAGE)
    await settleForAxe(page)

    // Four buttons carry this title; one is visible below the `lg` breakpoint.
    await page
      .locator('button[title="Menu dropdown button"]')
      .filter({ visible: true })
      .first()
      .click()

    // The drawer has no dialog role (itself a finding), so this class-based
    // selector is the only handle. Asserted so a markup change fails loudly
    // instead of silently scanning the unopened page as clean.
    const drawer = page.locator('div.bg-overlay.fixed.inset-0')
    await expect(drawer, 'Mobile navigation drawer should open').toBeVisible()
    await settleForAxe(page)

    // Full-page: the drawer covers the viewport while the page behind it stays
    // in the accessibility tree, and that interaction is the point.
    await captureSurface(page, testInfo, 'Mobile navigation drawer', {
      area: 'chrome/mobile-nav',
    })
  })

  test('feedback widget', async ({ page }, testInfo) => {
    await page.goto(HOST_PAGE)
    await settleForAxe(page)

    const feedback = page.locator('section[aria-labelledby="feedback-title"]')
    await expect(feedback, 'Feedback widget should render').toBeVisible()

    // A heading and two buttons — genuinely ~15 elements, so the default
    // whole-page floor would misread it as unrendered.
    const feedbackMinElements = 5

    await captureSurface(page, testInfo, 'Feedback widget', {
      include: 'section[aria-labelledby="feedback-title"]',
      area: 'chrome/feedback',
      minElements: feedbackMinElements,
    })

    // "Yes" swaps in a follow-up state with different controls.
    await feedback.getByRole('button', { name: 'Yes', exact: true }).click()
    await settleForAxe(page)

    await captureSurface(page, testInfo, 'Feedback widget - submitted', {
      include: 'section[aria-labelledby="feedback-title"]',
      area: 'chrome/feedback',
      minElements: feedbackMinElements,
    })
  })
})
