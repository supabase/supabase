import type { Page } from '@playwright/test'

export const GUIDE_ARTICLE_SELECTOR = '[data-testid="sb-docs-guide-main-article"]'
export const TROUBLESHOOTING_ARTICLE_SELECTOR =
  '[data-testid="sb-docs-troubleshooting-main-article"]'
const DOCS_PATH_PREFIX = '/docs'
const TROUBLESHOOTING_PATH_PREFIX = '/docs/guides/troubleshooting/'

/**
 * Pick the main article selector for a docs page path.
 * Both guides and troubleshooting entries expose a stable data-testid.
 */
export function articleSelectorForPagePath(pagePath: string): string {
  const pathname = pagePath.startsWith('http') ? new URL(pagePath).pathname : pagePath

  if (
    pathname === TROUBLESHOOTING_PATH_PREFIX.slice(0, -1) ||
    pathname.startsWith(TROUBLESHOOTING_PATH_PREFIX)
  ) {
    return TROUBLESHOOTING_ARTICLE_SELECTOR
  }

  return GUIDE_ARTICLE_SELECTOR
}

/**
 * Collect unique docs-owned links from the main article.
 *
 * Cross-app paths such as `/ui` and `/dashboard` are excluded because the
 * docs preview does not own those routes.
 */
export async function collectDocsOwnedLinks(
  page: Page,
  baseURL: string,
  articleSelector: string = GUIDE_ARTICLE_SELECTOR
): Promise<string[]> {
  const origin = new URL(baseURL).origin
  const hrefs = await page
    .locator(`${articleSelector} a[href]`)
    .evaluateAll((anchors) =>
      anchors.map((anchor) => (anchor as HTMLAnchorElement).getAttribute('href') ?? '')
    )
  const links = new Set<string>()

  for (const href of hrefs) {
    if (!href || href.startsWith('#')) continue

    let url: URL
    try {
      url = new URL(href, baseURL)
    } catch {
      continue
    }

    if (!['http:', 'https:'].includes(url.protocol)) continue
    if (url.origin !== origin) continue
    if (url.pathname !== DOCS_PATH_PREFIX && !url.pathname.startsWith(`${DOCS_PATH_PREFIX}/`)) {
      continue
    }

    url.hash = ''
    links.add(url.toString())
  }

  return [...links].sort()
}

/**
 * Playwright's headless Chromium reports a `HeadlessChrome` UA string, which
 * Vercel's bot protection blocks on some routes (notably /docs/reference/*)
 * even though the same page loads fine for a real browser. Stripping
 * `Headless` avoids that false positive when checking links out-of-band via
 * page.request rather than an actual navigation.
 */
export async function browserLikeUserAgent(page: Page): Promise<string> {
  const userAgent = await page.evaluate(() => navigator.userAgent)
  return userAgent.replace('HeadlessChrome', 'Chrome')
}

/**
 * Parse DOCS_E2E_PAGE_PATHS (comma- or newline-separated /docs/... paths).
 */
export function parseDocsE2EPagePaths(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/[\n,]/)
    .map((path) => path.trim())
    .filter(Boolean)
    .map((path) => (path.startsWith('/') ? path : `/${path}`))
}
