import type { Locator, Page } from '@playwright/test'

export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
} as const

export type ViewportName = keyof typeof VIEWPORTS

export type ViewportScopedElement = {
  viewports?: readonly ViewportName[]
}

// Responsive layouts ship some elements twice and hide one copy. Axe skips
// hidden subtrees, so scanning the hidden one passes while scanning nothing.
export function renderedLocator(page: Page, selector: string): Locator {
  return page.locator(`${selector}:visible`).first()
}

// An element without a `viewports` allowlist is expected at every viewport.
export function elementsForViewport<T extends ViewportScopedElement>(
  elements: readonly T[],
  viewport: ViewportName
): T[] {
  return elements.filter((element) => !element.viewports || element.viewports.includes(viewport))
}
