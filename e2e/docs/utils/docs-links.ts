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

export type LinkTarget = {
  url: string
  anchor?: string
}

function decodeAnchor(hash: string): string {
  try {
    return decodeURIComponent(hash)
  } catch {
    return hash
  }
}

export function docsOwnedLinkTargets(
  hrefs: string[],
  pageUrl: string,
  baseURL: string
): LinkTarget[] {
  const origin = new URL(baseURL).origin
  const links = new Map<string, LinkTarget>()

  for (const href of hrefs) {
    if (!href || href === '#') continue

    let url: URL
    try {
      url = new URL(href, pageUrl)
    } catch {
      continue
    }

    if (!['http:', 'https:'].includes(url.protocol)) continue
    if (url.origin !== origin) continue
    if (url.pathname !== DOCS_PATH_PREFIX && !url.pathname.startsWith(`${DOCS_PATH_PREFIX}/`)) {
      continue
    }

    const anchor = decodeAnchor(url.hash.slice(1))
    url.hash = ''
    const target: LinkTarget = anchor ? { url: url.toString(), anchor } : { url: url.toString() }
    links.set(`${target.url}#${anchor}`, target)
  }

  return [...links.keys()].sort().map((key) => links.get(key)!)
}

export async function collectDocsOwnedLinks(
  page: Page,
  baseURL: string,
  articleSelector: string = GUIDE_ARTICLE_SELECTOR
): Promise<LinkTarget[]> {
  const hrefs = await page
    .locator(`${articleSelector} a[href]`)
    .evaluateAll((anchors) =>
      anchors.map((anchor) => (anchor as HTMLAnchorElement).getAttribute('href') ?? '')
    )

  return docsOwnedLinkTargets(hrefs, page.url(), baseURL)
}

export type LinkCheckResult = {
  ok: boolean
  status: number
  error?: string
  anchors: string[]
}

const linkChecks = new Map<string, Promise<LinkCheckResult>>()

// The docs middleware rewrites /reference/* requests whose user agent looks like a bot
// (isbot, which matches HeadlessChrome) to /api/crawlers. Fetching from inside the page
// keeps the browser's own user agent and network stack, so a link resolves the same way
// page.goto resolves it in this suite.
export function checkLinkFromBrowser(page: Page, url: string): Promise<LinkCheckResult> {
  let check = linkChecks.get(url)
  if (!check) {
    check = page.evaluate(async (linkUrl) => {
      try {
        const response = await fetch(linkUrl)
        if (!response.ok) return { ok: false, status: response.status, anchors: [] }

        const doc = new DOMParser().parseFromString(await response.text(), 'text/html')
        const anchors = [
          ...[...doc.querySelectorAll('[id]')].map((element) => element.id),
          ...[...doc.querySelectorAll('a[name]')].map((element) => element.getAttribute('name')!),
        ]
        return { ok: true, status: response.status, anchors }
      } catch (error) {
        return {
          ok: false,
          status: 0,
          error: error instanceof Error ? error.message : String(error),
          anchors: [],
        }
      }
    }, url)
    check.catch(() => linkChecks.delete(url))
    linkChecks.set(url, check)
  }
  return check
}

export function hasAnchorOnPage(page: Page, anchor: string): Promise<boolean> {
  return page.evaluate(
    (id) =>
      !!(document.getElementById(id) ?? document.querySelector(`a[name="${CSS.escape(id)}"]`)),
    anchor
  )
}
