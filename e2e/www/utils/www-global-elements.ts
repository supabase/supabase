import {
  elementsForViewport,
  type ViewportName,
  type ViewportScopedElement,
} from '../../shared/viewports.ts'
import { wwwArticleSelectorForPagePath } from './www-selectors.ts'

export interface GlobalElementConfig extends ViewportScopedElement {
  selector: string
  label: string
}

export const GLOBAL_ELEMENTS = {
  nav: { selector: '[data-testid="sb-www-nav"]', label: 'site navigation' },
  footer: { selector: 'footer', label: 'site footer' },
  menuTrigger: {
    selector: '[data-testid="sb-www-mobile-menu-trigger"]',
    label: 'mobile menu trigger',
    // `lg:hidden`, so it is out of reach at the 1280px desktop viewport.
    viewports: ['mobile'],
  },
} as const satisfies Record<string, GlobalElementConfig>

export type GlobalElement = keyof typeof GLOBAL_ELEMENTS

export const MOBILE_MENU_SELECTOR = '[data-testid="sb-www-mobile-menu"]'

export function globalElementsForViewport(
  names: readonly GlobalElement[],
  viewport: ViewportName
): GlobalElementConfig[] {
  return elementsForViewport(
    names.map((name): GlobalElementConfig => GLOBAL_ELEMENTS[name]),
    viewport
  )
}

export interface GlobalElementPage {
  path: string
  layout: string
  elements: readonly GlobalElement[]
  // Listing pages and the home page render no article wrapper. Excluding a
  // selector that matches nothing would silently widen the scan.
  articleSelector: string | null
}

const CHROME: readonly GlobalElement[] = ['nav', 'footer', 'menuTrigger']

// A second page on a covered layout would scan the same chrome.
export const GLOBAL_ELEMENT_PAGES: readonly GlobalElementPage[] = [
  {
    path: '/',
    layout: 'marketing home',
    elements: CHROME,
    articleSelector: null,
  },
  {
    path: '/blog',
    layout: 'blog index',
    elements: CHROME,
    articleSelector: null,
  },
  {
    path: '/blog/supabase-steve-chavez',
    layout: 'blog post',
    elements: CHROME,
    articleSelector: wwwArticleSelectorForPagePath('/blog/supabase-steve-chavez'),
  },
  {
    path: '/events',
    layout: 'events index',
    elements: CHROME,
    articleSelector: null,
  },
  {
    path: '/events/vibe-to-live-datadog',
    layout: 'event',
    elements: CHROME,
    articleSelector: wwwArticleSelectorForPagePath('/events/vibe-to-live-datadog'),
  },
  {
    path: '/customers',
    layout: 'customers index',
    elements: CHROME,
    articleSelector: null,
  },
  {
    path: '/customers/chatbase',
    layout: 'customer story',
    elements: CHROME,
    articleSelector: wwwArticleSelectorForPagePath('/customers/chatbase'),
  },
  {
    path: '/alternatives/supabase-vs-firebase',
    layout: 'alternatives comparison',
    elements: CHROME,
    articleSelector: wwwArticleSelectorForPagePath('/alternatives/supabase-vs-firebase'),
  },
]
