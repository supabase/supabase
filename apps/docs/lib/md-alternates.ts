import { PROD_URL } from '~/lib/constants'
import MARKDOWN_SLUGS from '~/public/markdown/manifest.json'

const SLUGS = new Set<string>(MARKDOWN_SLUGS)

type MdAlternate = { 'text/markdown': string }

export function mdAlternate(slug: string): MdAlternate | undefined {
  if (!SLUGS.has(slug)) return undefined
  return { 'text/markdown': `${PROD_URL}/guides/${slug}.md` }
}

export function homepageMdAlternate(): MdAlternate {
  return { 'text/markdown': 'https://supabase.com/docs.md' }
}
