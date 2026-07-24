import type { Page } from '@playwright/test'

const ARTICLE_SELECTOR = '#sb-docs-guide-main-article'
const DOCS_PATH_PREFIX = '/docs'

/**
 * Collect unique docs-owned links from the main guide article.
 *
 * Cross-app paths such as `/ui` and `/dashboard` are excluded because the
 * docs preview does not own those routes.
 */
export async function collectDocsOwnedLinks(page: Page, baseURL: string): Promise<string[]> {
  const origin = new URL(baseURL).origin
  const hrefs = await page
    .locator(`${ARTICLE_SELECTOR} a[href]`)
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
