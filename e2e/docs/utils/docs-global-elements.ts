import type { Page } from '@playwright/test'

import type { ViewportName } from '../../shared/viewports.ts'
import { GUIDE_ARTICLE_SELECTOR, TROUBLESHOOTING_ARTICLE_SELECTOR } from './docs-links.js'

interface GlobalElementConfig {
  selector: string
  label: string
  // Defaults to both viewports.
  viewports?: readonly ViewportName[]
}

const ELEMENT_TABLE = {
  topNav: { selector: '[data-testid="sb-docs-top-nav"]', label: 'top navigation bar' },
  sidebarNav: {
    selector: '[data-testid="sb-docs-sidebar-nav"]',
    label: 'sidebar navigation',
    // In the DOM at mobile, but collapsed to `w-0 -left-full`.
    viewports: ['desktop'],
  },
  tocSidebar: {
    selector: '[data-testid="sb-docs-toc-sidebar"]',
    label: 'content sidebar',
    // `hidden md:flex`, so axe skips it below 768px.
    viewports: ['desktop'],
  },
  breadcrumbs: { selector: '[data-testid="sb-docs-breadcrumbs"]', label: 'breadcrumbs' },
  footer: { selector: '[data-testid="sb-docs-footer"]', label: 'site footer' },
  menuTrigger: {
    selector: '[data-testid="sb-docs-mobile-menu-trigger"]',
    label: 'mobile menu trigger',
    viewports: ['mobile'],
  },
} as const

export type GlobalElement = keyof typeof ELEMENT_TABLE

export const GLOBAL_ELEMENTS: Record<GlobalElement, GlobalElementConfig> = ELEMENT_TABLE

export const MOBILE_MENU_SELECTOR = '[data-testid="sb-docs-mobile-menu"]'

export interface GlobalElementPage {
  path: string
  layout: string
  elements: GlobalElement[]
}

// A second page on a covered layout would scan the same markup.
export const GLOBAL_ELEMENT_PAGES: GlobalElementPage[] = [
  {
    path: '/docs',
    layout: 'home',
    elements: ['topNav', 'menuTrigger', 'footer'],
  },
  {
    path: '/docs/guides/getting-started',
    layout: 'guides section landing',
    elements: ['topNav', 'menuTrigger', 'sidebarNav', 'tocSidebar', 'footer'],
  },
  {
    path: '/docs/guides/database/postgres/row-level-security',
    layout: 'guide with table of contents',
    elements: ['topNav', 'menuTrigger', 'sidebarNav', 'tocSidebar', 'breadcrumbs', 'footer'],
  },
  {
    path: '/docs/guides/troubleshooting',
    layout: 'troubleshooting index',
    elements: ['topNav', 'menuTrigger', 'footer'],
  },
  {
    path: '/docs/guides/troubleshooting/all-about-supabase-egress-a_Sg_e',
    layout: 'troubleshooting entry',
    elements: ['topNav', 'menuTrigger', 'breadcrumbs', 'footer'],
  },
  {
    path: '/docs/reference/cli/introduction',
    layout: 'reference',
    elements: ['topNav', 'menuTrigger', 'sidebarNav', 'footer'],
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
