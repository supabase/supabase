import { Root } from 'mdast'
import { visit } from 'unist-util-visit'

const DOCS_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/docs'

/**
 * Prepend the docs basePath to a root-relative href, mirroring what Next.js
 * `<Link>` does at render time. Used when extracting an `href` attribute out
 * of MDX `<Link>` components into plain markdown — without this, links like
 * `/guides/foo` lose the `/docs` prefix the deployed site adds.
 *
 * Returns the href unchanged when it's already prefixed, external, anchor-
 * only, or relative (`./`, `../`).
 */
export function withDocsBasePath(href: string): string {
  if (!href.startsWith('/')) return href
  if (href.startsWith('//')) return href
  if (href === DOCS_BASE_PATH || href.startsWith(`${DOCS_BASE_PATH}/`)) return href
  return `${DOCS_BASE_PATH}${href}`
}

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

export function addBaseUrlPrefix(tree: Root) {
  const baseUrl = getInternalLinkBaseUrl()

  visit(tree, 'link', (node) => {
    if (node.url.startsWith('/') && !node.url.startsWith('//')) {
      node.url = baseUrl + node.url
    }
  })

  return tree
}
