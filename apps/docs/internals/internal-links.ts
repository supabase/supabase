/**
 * Returns the absolute base URL to prepend to root-relative markdown links
 * (e.g. `/dashboard/...`). Empty when no rewrite should happen — typically
 * local development, where keeping links relative lets them resolve against
 * whatever host the dev server is on.
 *
 * Resolution order:
 *  - `VERCEL_ENV=production` → `https://supabase.com`
 *  - `VERCEL_ENV=preview`    → `https://${VERCEL_URL}`
 *  - anything else           → ''
 */
export function getInternalLinkBaseUrl(): string {
  const env = process.env.VERCEL_ENV
  if (env === 'production') return 'https://supabase.com'
  if (env === 'preview' && process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return ''
}

/**
 * Rewrite root-relative markdown links by prepending `baseUrl`:
 *   `[text](/foo)` → `[text](${baseUrl}/foo)`
 *
 * Skips fenced code blocks, image syntax (`![alt](...)`), protocol-relative
 * URLs (`//host/...`), and non-root-relative targets (`http://`, `mailto:`,
 * `#anchor`, `./`, `../`).
 */
export function prefixInternalLinks(content: string, baseUrl: string): string {
  if (!baseUrl) return content
  const segments = content.split(/(```[\s\S]*?```)/g)
  return segments
    .map((seg, i) => {
      if (i % 2 === 1) return seg
      return seg.replace(/(?<!!)(\[[^\]]*\])\((\/[^)\s]*)\)/g, (match, text, url) => {
        if (url.startsWith('//')) return match
        return `${text}(${baseUrl}${url})`
      })
    })
    .join('')
}
