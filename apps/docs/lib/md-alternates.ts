import { PROD_URL } from '~/lib/constants'
import MARKDOWN_SLUGS from '~/public/markdown/manifest.json'

const SLUGS = new Set<string>(MARKDOWN_SLUGS)

export function mdAlternate(slug: string): { 'text/markdown': string } | undefined {
  if (!SLUGS.has(slug)) return undefined
  const href = slug === 'index' ? `${PROD_URL}/index.md` : `${PROD_URL}/guides/${slug}.md`
  return { 'text/markdown': href }
}
