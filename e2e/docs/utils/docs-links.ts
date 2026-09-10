import type { Page } from '@playwright/test'

export const GUIDE_ARTICLE_SELECTOR = '[data-testid="sb-docs-guide-main-article"]'
export const TROUBLESHOOTING_ARTICLE_SELECTOR =
  '[data-testid="sb-docs-troubleshooting-main-article"]'
const DOCS_PATH_PREFIX = '/docs'
const TROUBLESHOOTING_PATH_PREFIX = '/docs/guides/troubleshooting/'

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

export type LinkCheckResult = {
  ok: boolean
  status: number
  error?: string
}

// Vercel routes requests without a real browser network fingerprint (e.g. Playwright's
// Node-side page.request) differently from page navigations, and heavy reference pages
// 502 with FALLBACK_BODY_TOO_LARGE on that path. Fetching from inside the page uses the
// same network stack as page.goto, so it resolves like a real browser visit would.
export async function checkLinkFromBrowser(page: Page, url: string): Promise<LinkCheckResult> {
  return page.evaluate(async (linkUrl) => {
    try {
      const response = await fetch(linkUrl)
      return { ok: response.ok, status: response.status }
    } catch (error) {
      return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) }
    }
  }, url)
}
