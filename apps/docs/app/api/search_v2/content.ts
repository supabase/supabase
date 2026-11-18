import { BASE_PATH, IS_DEV, IS_PRODUCTION, PROD_URL } from '~/lib/constants'

/**
 * Resolves the docs base URL (origin + base path) from trusted sources only, so the Host header
 * can't redirect the fetches made for `content=true` (SSRF). The request origin is used in local
 * development only.
 */
export function resolveDocsBaseUrl(requestUrl: string): string | undefined {
  if (IS_PRODUCTION) return PROD_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${BASE_PATH}`
  if (process.env.NEXT_PUBLIC_SITE_URL) return `${process.env.NEXT_PUBLIC_SITE_URL}${BASE_PATH}`
  if (IS_DEV) return `${new URL(requestUrl).origin}${BASE_PATH}`
  return undefined
}

/**
 * Fetches the markdown export of a page (`<base>/<slug>.md`). Returns null when it can't be
 * loaded, including pages with no markdown export (only guides have one).
 */
export async function fetchMarkdown(
  baseUrl: string | undefined,
  slug: string
): Promise<string | null> {
  const segments = slug.split('/')
  if (!baseUrl || segments[0] !== 'guides' || segments.some((s) => !s || s === '.' || s === '..')) {
    return null
  }

  const url = `${baseUrl}/${segments.map(encodeURIComponent).join('/')}.md`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`Failed to fetch docs content from ${url}: ${response.status}`)
      return null
    }
    return await response.text()
  } catch (error) {
    console.warn(`Failed to fetch docs content from ${url}:`, error)
    return null
  }
}
