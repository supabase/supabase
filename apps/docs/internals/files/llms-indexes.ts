import type { SitemapPage } from './sitemap-pages'

const DOCS_URL = 'https://supabase.com/docs'

export type IndexedPage = Pick<SitemapPage, 'link' | 'title' | 'version' | 'parentTitle'>

export interface LlmsIndex {
  path: string
  title: string
  content: string
}

interface Area {
  section: string
  version?: string
  pages: Array<IndexedPage>
}

function linkText(text: string) {
  return text.replace(/[\\[\]]/g, (char) => `\\${char}`)
}

function sectionOf(page: IndexedPage) {
  return page.link.split('/').slice(0, 2).join('/')
}

// Reference pages have no per-page markdown, so they link to HTML.
function pageUrl(page: IndexedPage) {
  const url = `${DOCS_URL}/${page.link}`
  return page.link.startsWith('guides/') ? `${url}.md` : url
}

function buildIndex(
  path: string,
  { section, version, pages }: Area,
  areaTitles: Record<string, string>
): LlmsIndex {
  const slug = section.split('/')[1]
  const label = (
    areaTitles[section] ??
    pages.find((page) => page.link === section)?.title ??
    `${slug[0].toUpperCase()}${slug.slice(1)}`
  ).replace(/^Supabase /, '')
  const isGuide = section.startsWith('guides/')
  const title = `Supabase ${label} ${isGuide ? 'guides' : 'reference'}${version ? ` ${version}` : ''}`
  const summary = isGuide
    ? `Every page in the ${title}, linked to its markdown.`
    : `Every page in the ${title}.`

  const content = [
    `# ${title}`,
    '',
    `> ${summary}`,
    '',
    '## Pages',
    '',
    ...pages.map((page) => {
      const text = page.parentTitle ? `${page.parentTitle}: ${page.title}` : page.title
      return `- [${linkText(text)}](${pageUrl(page)})`
    }),
    '',
  ].join('\n')

  return { path, title, content }
}

/** The docs-scoped llms.txt, served at /docs/llms.txt, linking one index per area. */
export function buildDocsLlmsTxt(indexes: Array<LlmsIndex>): string {
  const unlinked = indexes.filter(
    (index) => !index.path.startsWith('guides/') && !index.path.startsWith('reference/')
  )
  if (unlinked.length > 0) {
    throw new Error(
      `No llms.txt heading for indexes: ${unlinked.map((index) => index.path).join(', ')}`
    )
  }

  const links = (prefix: string) =>
    indexes
      .filter((index) => index.path.startsWith(prefix))
      .map((index) => `- [${linkText(index.title)}](${DOCS_URL}/llms/${index.path}.txt)`)

  return [
    '# Supabase Docs',
    '',
    '> Supabase is a Postgres development platform. Each index below lists every page in one area of the docs: a guide section, an SDK, the CLI, or the Management API.',
    '',
    // Bare URLs, not links, so AFDocs doesn't walk these large files as page indexes.
    'For the complete documentation in a single file, see https://supabase.com/llms-full.txt. For product overviews and pricing, see the site-wide index at https://supabase.com/llms.txt.',
    '',
    '## Guides',
    '',
    ...links('guides/'),
    '',
    '## Reference',
    '',
    ...links('reference/'),
    '',
  ].join('\n')
}

export function buildLlmsIndexes(
  pages: Array<IndexedPage>,
  areaTitles: Record<string, string>
): Array<LlmsIndex> {
  const areas = new Map<string, Area>()
  for (const page of pages) {
    const section = sectionOf(page)
    const path = page.version ? `${section}/${page.version}` : section
    const area = areas.get(path) ?? { section, version: page.version, pages: [] }
    area.pages.push(page)
    areas.set(path, area)
  }

  return Array.from(areas, ([path, area]) => buildIndex(path, area, areaTitles)).sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0
  )
}
