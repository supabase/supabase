import { existsSync, promises as fs } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { SITE_ORIGIN } from './lib/constants'
import { mdAlternates } from './lib/md-alternates'

const DYNAMIC_SLUGS = ['pricing']

const MDX_SECTIONS = ['blog', 'customers', 'events']

async function collectContentMdSlugs(dir: string, prefix = ''): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  const slugs: string[] = []
  for (const dirent of dirents) {
    const slug = prefix ? `${prefix}/${dirent.name}` : dirent.name
    if (dirent.isDirectory()) {
      slugs.push(...(await collectContentMdSlugs(path.join(dir, dirent.name), slug)))
    } else if (dirent.name.endsWith('.md')) {
      slugs.push(slug.replace(/\.md$/, ''))
    }
  }
  return slugs
}

async function collectAppRouterPages(
  dir: string,
  segments: string[] = []
): Promise<Map<string, string>> {
  const pages = new Map<string, string>()
  const dirents = await fs.readdir(dir, { withFileTypes: true })
  for (const dirent of dirents) {
    if (dirent.isDirectory()) {
      if (dirent.name.startsWith('[') || dirent.name.startsWith('_')) continue
      const nextSegments = dirent.name.startsWith('(') ? segments : [...segments, dirent.name]
      const nested = await collectAppRouterPages(path.join(dir, dirent.name), nextSegments)
      nested.forEach((filePath, slug) => pages.set(slug, filePath))
    } else if (dirent.name === 'page.tsx') {
      pages.set(segments.join('/') || 'index', path.join(dir, dirent.name))
    }
  }
  return pages
}

describe('mdAlternates', () => {
  it('emits the absolute .md sibling URL', () => {
    expect(mdAlternates('auth')).toEqual({
      types: { 'text/markdown': `${SITE_ORIGIN}/auth.md` },
    })
    expect(mdAlternates('modules/vector')).toEqual({
      types: { 'text/markdown': `${SITE_ORIGIN}/modules/vector.md` },
    })
  })
})

describe('markdown alternate drift', () => {
  it('every markdown-served slug has a page advertising its .md sibling', async () => {
    const contentSlugs = await collectContentMdSlugs(path.join(process.cwd(), 'content/md'))
    const expectedSlugs = [...contentSlugs, ...DYNAMIC_SLUGS]
    const appPages = await collectAppRouterPages(path.join(process.cwd(), 'app'))

    expect(contentSlugs.length).toBeGreaterThan(0)

    for (const slug of expectedSlugs) {
      const appPagePath = appPages.get(slug)
      if (appPagePath) {
        const source = await fs.readFile(appPagePath, 'utf-8')
        const wiringShapes = [`alternates: mdAlternates('${slug}')`, `...mdAlternates('${slug}')`]
        expect(
          wiringShapes.some((shape) => source.includes(shape)),
          `${path.relative(process.cwd(), appPagePath)} must wire mdAlternates('${slug}') into its metadata export, either as "alternates: mdAlternates('${slug}')" or spread into a wider alternates object as "...mdAlternates('${slug}')"`
        ).toBe(true)
      } else {
        expect(
          existsSync(path.join(process.cwd(), 'pages', `${slug}.tsx`)),
          `no page found for markdown slug "${slug}" — App Router pages need mdAlternates, Pages Router pages are covered by _app.tsx`
        ).toBe(true)
      }
    }
  })

  it('pages/_app.tsx advertises the .md sibling for Pages Router pages', async () => {
    const source = await fs.readFile(path.join(process.cwd(), 'pages', '_app.tsx'), 'utf-8')
    expect(
      source.includes('MD_PAGES.has('),
      'pages/_app.tsx must gate the markdown alternate on MD_PAGES membership'
    ).toBe(true)
    expect(
      source.includes('rel="alternate" type="text/markdown"'),
      'pages/_app.tsx must render the text/markdown alternate link for markdown-served slugs'
    ).toBe(true)
  })

  it('changelog entry page gates its .md alternate on CHANGELOG_PAGES membership', async () => {
    const source = await fs.readFile(
      path.join(process.cwd(), 'pages', 'changelog', '[slug].tsx'),
      'utf-8'
    )
    expect(
      source.includes('CHANGELOG_PAGES.has(`changelog/${entry.slug}`)'),
      'pages/changelog/[slug].tsx must compute the markdown alternate flag from CHANGELOG_PAGES membership using the changelog/-prefixed key the generator emits'
    ).toBe(true)
    expect(
      source.includes('hasMarkdownVariant &&'),
      'pages/changelog/[slug].tsx must render the markdown alternate link only when hasMarkdownVariant is true'
    ).toBe(true)
    expect(
      source.includes('rel="alternate" type="text/markdown"'),
      'pages/changelog/[slug].tsx must advertise the text/markdown alternate for published slugs'
    ).toBe(true)
  })

  it.for(MDX_SECTIONS)('%s pages advertise their .md sibling', async (urlPrefix) => {
    const appPagePath = path.join(process.cwd(), 'app', urlPrefix, '[slug]', 'page.tsx')
    if (!existsSync(appPagePath)) {
      expect(
        existsSync(path.join(process.cwd(), 'pages', urlPrefix)),
        `section "${urlPrefix}" has neither app/${urlPrefix}/[slug]/page.tsx nor pages/${urlPrefix}/`
      ).toBe(true)
      return
    }
    const source = await fs.readFile(appPagePath, 'utf-8')
    const wiring = 'alternates: mdAlternates(`' + urlPrefix + '/${slug}`)'
    expect(
      source.includes(wiring),
      `app/${urlPrefix}/[slug]/page.tsx must contain "${wiring}" in its generateMetadata`
    ).toBe(true)
  })
})
