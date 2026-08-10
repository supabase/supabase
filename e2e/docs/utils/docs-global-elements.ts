import type { Page } from '@playwright/test'

import { GUIDE_ARTICLE_SELECTOR, TROUBLESHOOTING_ARTICLE_SELECTOR } from './docs-links.js'

export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
} as const

export type ViewportName = keyof typeof VIEWPORTS

// Selectors match `data-test` attributes in apps/docs, so restyling or
// remarkup cannot silently drop an element out of the scan. `viewports` lists
// where an element is expected to be visible; it defaults to both.
export const GLOBAL_ELEMENTS = {
  topNav: { selector: '[data-test="sb-docs-top-nav"]', label: 'top navigation bar' },
  sidebarNav: {
    selector: '[data-test="sb-docs-sidebar-nav"]',
    label: 'sidebar navigation',
    // In the DOM at mobile, but collapsed to `w-0 -left-full`.
    viewports: ['desktop'],
  },
  tocSidebar: {
    selector: '[data-test="sb-docs-toc-sidebar"]',
    label: 'content sidebar',
    // `hidden md:flex`, so axe skips it below 768px.
    viewports: ['desktop'],
  },
  breadcrumbs: { selector: '[data-test="sb-docs-breadcrumbs"]', label: 'breadcrumbs' },
  footer: { selector: '[data-test="sb-docs-footer"]', label: 'site footer' },
  menuTrigger: {
    selector: '[data-test="sb-docs-mobile-menu-trigger"]',
    label: 'mobile menu trigger',
    viewports: ['mobile'],
  },
} as const

export type GlobalElement = keyof typeof GLOBAL_ELEMENTS

export const MOBILE_MENU_SELECTOR = '[data-test="sb-docs-mobile-menu"]'

export interface GlobalElementPage {
  path: string
  layout: string
  elements: GlobalElement[]
}

// One page per layout. These elements are global, so a second page on a layout
// already covered scans the same markup for the same result.
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

// The top bar ships twice, once in a `hidden lg:flex` wrapper and once in a
// `flex lg:hidden` one, so match whichever copy renders at this viewport.
export function renderedLocator(page: Page, selector: string) {
  return page.locator(`${selector}:visible`).first()
}

export function elementsForViewport(
  elements: GlobalElement[],
  viewport: ViewportName
): GlobalElement[] {
  return elements.filter((name) => {
    const viewports = (GLOBAL_ELEMENTS[name] as { viewports?: readonly ViewportName[] }).viewports
    return !viewports || viewports.includes(viewport)
  })
}

const ARTICLE_SELECTORS = [GUIDE_ARTICLE_SELECTOR, TROUBLESHOOTING_ARTICLE_SELECTOR]

// Excluding a selector that matches nothing would silently widen the scan.
export async function articleSelectorsOnPage(page: Page): Promise<string[]> {
  const present: string[] = []
  for (const selector of ARTICLE_SELECTORS) {
    if ((await page.locator(selector).count()) > 0) present.push(selector)
  }
  return present
}
