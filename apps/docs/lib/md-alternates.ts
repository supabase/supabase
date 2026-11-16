import { PROD_URL } from '~/lib/constants'
import MARKDOWN_SLUGS from '~/public/markdown/manifest.json'

const SLUGS = new Set<string>(MARKDOWN_SLUGS)

export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'

/** `alternates.types` entry pointing at a page's Markdown twin. */
export function mdAlternateAt(url: string): { 'text/markdown': string } {
  return { 'text/markdown': url }
}

export function mdUrl(slug: string): string | undefined {
  if (!SLUGS.has(slug)) return undefined
  return `${PROD_URL}/guides/${slug}.md`
}

export function mdAlternate(slug: string): { 'text/markdown': string } | undefined {
  const url = mdUrl(slug)
  return url ? mdAlternateAt(url) : undefined
}
