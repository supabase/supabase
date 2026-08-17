export const BLOG_ARTICLE_SELECTOR = '[data-testid="sb-www-blog-main-article"]'
export const EVENT_ARTICLE_SELECTOR = '[data-testid="sb-www-event-main-article"]'
export const CUSTOMER_ARTICLE_SELECTOR = '[data-testid="sb-www-customer-main-article"]'
export const ALTERNATIVE_ARTICLE_SELECTOR = '[data-testid="sb-www-alternative-main-article"]'

// Default.tsx wraps every content template, and `#main` is the skip link target.
export const PAGE_SELECTOR = '#main'

const ARTICLE_SELECTORS_BY_PREFIX: ReadonlyArray<readonly [string, string]> = [
  ['/blog/', BLOG_ARTICLE_SELECTOR],
  ['/events/', EVENT_ARTICLE_SELECTOR],
  ['/customers/', CUSTOMER_ARTICLE_SELECTOR],
  ['/alternatives/', ALTERNATIVE_ARTICLE_SELECTOR],
]

// Only the four in-scope routes have a wrapper to scan, so anything else throws
// rather than guessing at one.
export function wwwArticleSelectorForPagePath(pagePath: string): string {
  const pathname = pagePath.startsWith('http') ? new URL(pagePath).pathname : pagePath

  for (const [prefix, selector] of ARTICLE_SELECTORS_BY_PREFIX) {
    if (pathname.startsWith(prefix)) return selector
  }

  throw new Error(
    `No article selector for "${pagePath}". This suite covers ${ARTICLE_SELECTORS_BY_PREFIX.map(
      ([prefix]) => prefix
    ).join(', ')} only.`
  )
}
