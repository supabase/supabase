import { PROD_URL } from '~/lib/constants'
import MARKDOWN_SLUGS from '~/public/markdown/manifest.json'

const SLUGS = new Set<string>(MARKDOWN_SLUGS)

export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'

export function mdAlternate(slug: string): { 'text/markdown': string } | undefined {
  if (!SLUGS.has(slug)) return undefined
  return { 'text/markdown': `${PROD_URL}/guides/${slug}.md` }
}
