import { PROD_URL } from '~/lib/constants'
import MARKDOWN_SLUGS from '~/public/markdown/manifest.json'
import REFERENCE_PATHS from '~/public/markdown/reference-manifest.json'

const SLUGS = new Set<string>(MARKDOWN_SLUGS)

export function mdAlternate(slug: string): { 'text/markdown': string } | undefined {
  if (!SLUGS.has(slug)) return undefined
  return { 'text/markdown': `${PROD_URL}/guides/${slug}.md` }
}

export function referenceMdAlternate(path: string): { 'text/markdown': string } | undefined {
  if (!Object.hasOwn(REFERENCE_PATHS, path)) return undefined
  return { 'text/markdown': `${PROD_URL}/reference/${path}.md` }
}

export function referenceMdAlternateLink(path: string): string {
  const href = referenceMdAlternate(path)?.['text/markdown']
  return href ? `<link rel="alternate" type="text/markdown" href="${href}">` : ''
}
