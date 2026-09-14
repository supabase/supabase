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

// The docs middleware rewrites /reference/* requests whose user agent looks like a bot
// (isbot, which matches HeadlessChrome) to /api/crawlers. Fetching from inside the page
// keeps the browser's own user agent and network stack, so a link resolves the same way
// page.goto resolves it in this suite.
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
