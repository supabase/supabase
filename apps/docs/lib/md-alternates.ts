import { PROD_URL } from '~/lib/constants'
import MARKDOWN_SLUGS from '~/public/markdown/manifest.json'

const SLUGS = new Set<string>(MARKDOWN_SLUGS)

export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'

export function mdUrl(slug: string): string | undefined {
  if (!SLUGS.has(slug)) return undefined
  return `${PROD_URL}/guides/${slug}.md`
}

export function mdAlternate(slug: string): { 'text/markdown': string } | undefined {
  const url = mdUrl(slug)
  return url ? { 'text/markdown': url } : undefined
}
