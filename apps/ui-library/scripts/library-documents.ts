import { readdirSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export function parseLibraryDocument(raw: string) {
  const { content, data } = matter(raw)
  for (const field of ['title', 'description', 'preview'] as const) {
    if (data[field] !== undefined && typeof data[field] !== 'string') {
      throw new Error(`Document ${field} must be a string`)
    }
  }
  return {
    content,
    data: data as { title?: string; description?: string; preview?: string },
  }
}

export function collectMdxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return collectMdxFiles(entryPath)
      return entry.name.endsWith('.mdx') ? [entryPath] : []
    })
    .sort((a, b) => a.localeCompare(b))
}

// Match Velite's flattened path, relative to content/docs.
export function getDocSlug(relativePath: string): string {
  return relativePath
    .replace(/\\/g, '/')
    .replace(/\.mdx$/, '')
    .replace(/\/index$/, '')
}

export function toAgentHref(
  href: string,
  documentSlugs?: ReadonlySet<string>,
  documentSlug?: string
): string {
  if (!href || href.startsWith('#') || href.startsWith('//')) return href
  const isRelative = !/^[a-z][a-z\d+.-]*:/i.test(href)
  if (!isRelative && !href.startsWith('https://supabase.com/library/docs/')) return href
  if (isRelative && !href.startsWith('/') && !documentSlug) return href

  const url = new URL(href, `https://supabase.com/library/docs/${documentSlug ?? ''}`)
  if (url.pathname.startsWith('/library/docs/')) {
    const slug = url.pathname.slice('/library/docs/'.length).replace(/\.md$/, '')
    if (documentSlugs && !documentSlugs.has(slug)) {
      throw new Error(`Missing library document: ${slug}`)
    }
    url.pathname = `/library/docs/${slug}.md`
  }
  return url.href
}
