import type { Page } from '@playwright/test'

import { GUIDE_ARTICLE_SELECTOR, TROUBLESHOOTING_ARTICLE_SELECTOR } from './docs-links.js'

// Selectors match `data-test` attributes in apps/docs, so restyling or
// remarkup cannot silently drop a region out of the scan.
export const GLOBAL_ELEMENTS = {
  topNav: { selector: '[data-test="sb-docs-top-nav"]', label: 'top navigation bar' },
  sidebarNav: { selector: '[data-test="sb-docs-sidebar-nav"]', label: 'sidebar navigation' },
  tocSidebar: { selector: '[data-test="sb-docs-toc-sidebar"]', label: 'table of contents sidebar' },
  breadcrumbs: { selector: '[data-test="sb-docs-breadcrumbs"]', label: 'breadcrumbs' },
  footer: { selector: '[data-test="sb-docs-footer"]', label: 'site footer' },
} as const

export type GlobalElement = keyof typeof GLOBAL_ELEMENTS

export interface GlobalElementPage {
  path: string
  layout: string
  landmarks: GlobalElement[]
}

// One page per layout. These elements are global, so a second page on a layout
// already covered scans the same markup for the same result.
export const GLOBAL_ELEMENT_PAGES: GlobalElementPage[] = [
  {
    path: '/docs',
    layout: 'home',
    landmarks: ['topNav', 'footer'],
  },
  {
    path: '/docs/guides/getting-started',
    layout: 'guides section landing',
    landmarks: ['topNav', 'sidebarNav', 'tocSidebar', 'footer'],
  },
  {
    path: '/docs/guides/database/postgres/row-level-security',
    layout: 'guide with table of contents',
    landmarks: ['topNav', 'sidebarNav', 'tocSidebar', 'breadcrumbs', 'footer'],
  },
  {
    path: '/docs/guides/troubleshooting',
    layout: 'troubleshooting index',
    landmarks: ['topNav', 'footer'],
  },
  {
    path: '/docs/guides/troubleshooting/all-about-supabase-egress-a_Sg_e',
    layout: 'troubleshooting entry',
    landmarks: ['topNav', 'breadcrumbs', 'footer'],
  },
  {
    path: '/docs/reference/cli/introduction',
    layout: 'reference',
    landmarks: ['topNav', 'sidebarNav', 'footer'],
  },
]

const ARTICLE_SELECTORS = [GUIDE_ARTICLE_SELECTOR, TROUBLESHOOTING_ARTICLE_SELECTOR]

// Excluding a selector that matches nothing would silently widen the scan.
export async function articleSelectorsOnPage(page: Page): Promise<string[]> {
  const present: string[] = []
  for (const selector of ARTICLE_SELECTORS) {
    if ((await page.locator(selector).count()) > 0) present.push(selector)
  }
  return present
}
