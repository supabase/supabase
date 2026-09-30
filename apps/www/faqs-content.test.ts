import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { describe, expect, it } from 'vitest'

// Content checks for the FAQ pages in _faqs/. Each page answers one question
// in plain markdown and links only to pages that exist.

const FAQ_DIR = path.join(process.cwd(), '_faqs')
const DOCS_GUIDES_DIR = path.join(process.cwd(), '..', 'docs', 'content', 'guides')

// Docs and other supabase.com links are absolute, so they work on www previews
// and in the markdown versions. Links between FAQ pages stay relative.
const DOCS_GUIDES_URL = 'https://supabase.com/docs/guides/'
const ALLOWED_LINK_PREFIXES = [
  'https://supabase.com/pricing',
  'https://supabase.com/dashboard',
  'https://www.postgresql.org/',
]

const files = fs
  .readdirSync(FAQ_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .sort()
const slugs = new Set(files.map((f) => f.replace(/\.mdx$/, '')))

function docsGuideExists(docsUrl: string): boolean {
  const rel = docsUrl
    .slice(DOCS_GUIDES_URL.length)
    .replace(/[#?].*$/, '')
    .replace(/\/$/, '')
  return (
    fs.existsSync(path.join(DOCS_GUIDES_DIR, `${rel}.mdx`)) ||
    fs.existsSync(path.join(DOCS_GUIDES_DIR, rel, 'index.mdx'))
  )
}

function linkTargets(markdown: string): string[] {
  return [...markdown.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1])
}

describe('FAQ pages', () => {
  it('has pages to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  describe.each(files)('%s', (file) => {
    const raw = fs.readFileSync(path.join(FAQ_DIR, file), 'utf8')
    const { data, content } = matter(raw)

    it('uses a kebab-case slug', () => {
      expect(file).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\.mdx$/)
    })

    it('is titled as a question', () => {
      expect(typeof data.title).toBe('string')
      expect(data.title.trim().endsWith('?')).toBe(true)
    })

    it('has a one-sentence answer as its description', () => {
      expect(typeof data.description).toBe('string')
      const description = data.description.trim()
      expect(description.length).toBeGreaterThan(40)
      expect(description.length).toBeLessThanOrEqual(220)
      expect(description.endsWith('.')).toBe(true)
    })

    it('has a YYYY-MM-DD date', () => {
      const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('contains no tables', () => {
      expect(/^\s*\|.*\|\s*$/m.test(content)).toBe(false)
    })

    it('contains no JSX or HTML', () => {
      const withoutCode = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '')
      expect(/<[A-Za-z/]/.test(withoutCode)).toBe(false)
    })

    it('links only to docs guides, other FAQs, or allowed pages that exist', () => {
      for (const target of linkTargets(content)) {
        if (target.startsWith(DOCS_GUIDES_URL)) {
          expect(docsGuideExists(target), `missing docs page: ${target}`).toBe(true)
        } else if (target.startsWith('/faqs/')) {
          const slug = target.replace(/^\/faqs\//, '').replace(/[#?].*$/, '')
          expect(slugs.has(slug), `missing FAQ page: ${target}`).toBe(true)
        } else {
          expect(
            ALLOWED_LINK_PREFIXES.some((prefix) => target.startsWith(prefix)),
            `link not allowed: ${target}`
          ).toBe(true)
        }
      }
    })
  })
})
