import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const GENERATOR = path.join(process.cwd(), 'internals', 'generate-sitemap.mjs')
const LEGACY_LINK = 'https://supabase.com/changelog/12345-legacy-entry'
const SPAWN_TIMEOUT_MS = 30_000

const createdDirs: string[] = []

type UrlEntry = { loc: string; lastmod?: string }

function writeFixture(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sitemap-'))
  createdDirs.push(dir)
  fs.mkdirSync(path.join(dir, 'public'), { recursive: true })
  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(dir, relativePath)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
  return dir
}

function runGenerator(fixtureDir: string) {
  return spawnSync(process.execPath, [GENERATOR], {
    cwd: fixtureDir,
    encoding: 'utf-8',
    env: { ...process.env, TZ: 'UTC' },
    timeout: SPAWN_TIMEOUT_MS,
  })
}

function mdx(frontmatter: string): string {
  return `---\n${frontmatter}\n---\n\n# Body\n`
}

function blogFixture(slugWithDate: string, frontmatter: string): Record<string, string> {
  return { [`_blog/${slugWithDate}.mdx`]: mdx(frontmatter) }
}

function rssItem(link: string, pubDate: string): string {
  return [
    '      <item>',
    `        <guid isPermaLink="true">${link}</guid>`,
    '        <title>Entry</title>',
    `        <link>${link}</link>`,
    `        <pubDate>${pubDate}</pubDate>`,
    '      </item>',
  ].join('\n')
}

function rss(items: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n${items.join('\n')}\n</channel></rss>\n`
}

function urlEntries(xml: string): UrlEntry[] {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    loc: block.match(/<loc>\s*([^<\s]+)\s*<\/loc>/)![1],
    lastmod: block.match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/)?.[1],
  }))
}

afterAll(() => {
  for (const dir of createdDirs) fs.rmSync(dir, { recursive: true, force: true })
})

describe('generate-sitemap lastmod', () => {
  let fixtureDir: string
  let result: ReturnType<typeof runGenerator>
  let sitemap = ''
  let entries: UrlEntry[] = []

  const entryFor = (loc: string) => entries.find((entry) => entry.loc === loc)

  beforeAll(() => {
    fixtureDir = writeFixture({
      ...blogFixture('2026-01-05-published-only', "date: '2026-01-05'"),
      ...blogFixture('2026-01-06-revised', "date: '2026-01-06'\nupdated: '2026-03-01'"),
      ...blogFixture('2026-01-07-with-time', "date: '2026-01-07T09:30:00'"),
      ...blogFixture('2026-01-08-unquoted-minutes', 'date: 2026-01-08T09:30'),
      ...blogFixture('2026-01-09-unquoted-date', 'date: 2026-01-09'),
      '_alternatives/supabase-vs-example.mdx': mdx("date: '2025-11-20'"),
      '_customers/acme.mdx': mdx("date: '2024-05-16T08:00:00Z'"),
      '_events/2026-02-01-webinar.mdx': mdx("date: '2026-02-01T19:00:00.000-07:00'"),
      'pages/pricing.tsx': '',
      'public/changelog-rss.xml': rss([rssItem(LEGACY_LINK, 'Tue, 03 Feb 2026 00:00:00 +0000')]),
    })
    result = runGenerator(fixtureDir)
    const sitemapPath = path.join(fixtureDir, 'public', 'sitemap_www.xml')
    if (fs.existsSync(sitemapPath)) {
      sitemap = fs.readFileSync(sitemapPath, 'utf-8')
      entries = urlEntries(sitemap)
    }
  }, SPAWN_TIMEOUT_MS)

  it('runs cleanly and writes sitemap_www.xml', () => {
    expect(result.status, result.stderr).toBe(0)
    expect(sitemap).not.toBe('')
  })

  it('uses the publish date when a post has no updated field', () => {
    expect(entryFor('https://supabase.com/blog/published-only')?.lastmod).toBe('2026-01-05')
  })

  it('prefers updated over date', () => {
    expect(entryFor('https://supabase.com/blog/revised')?.lastmod).toBe('2026-03-01')
  })

  it('drops the time part of a quoted datetime string', () => {
    expect(entryFor('https://supabase.com/blog/with-time')?.lastmod).toBe('2026-01-07')
  })

  it('accepts an unquoted datetime without seconds, which YAML leaves as a string', () => {
    expect(entryFor('https://supabase.com/blog/unquoted-minutes')?.lastmod).toBe('2026-01-08')
  })

  it('accepts an unquoted date-only value, which YAML parses into a Date', () => {
    expect(entryFor('https://supabase.com/blog/unquoted-date')?.lastmod).toBe('2026-01-09')
  })

  it('dates alternatives and customer stories from their frontmatter', () => {
    expect(entryFor('https://supabase.com/alternatives/supabase-vs-example')?.lastmod).toBe(
      '2025-11-20'
    )
    expect(entryFor('https://supabase.com/customers/acme')?.lastmod).toBe('2024-05-16')
  })

  it('emits no lastmod for events, static pages, and the proxied evals app', () => {
    for (const loc of [
      'https://supabase.com/events/webinar',
      'https://supabase.com/pricing',
      'https://supabase.com/evals',
    ]) {
      const entry = entryFor(loc)
      expect(entry, loc).toBeDefined()
      expect(entry?.lastmod, loc).toBeUndefined()
    }
  })

  it('dates legacy changelog entries from the RSS pubDate', () => {
    expect(entryFor(LEGACY_LINK)?.lastmod).toBe('2026-02-03')
  })

  it('emits only day-precision lastmod values, one per dated source', () => {
    const lastmods = entries.map((entry) => entry.lastmod).filter(Boolean)
    expect(lastmods).toHaveLength(8)
    for (const lastmod of lastmods) expect(lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('leaves the sitemap index untouched', () => {
    const index = fs.readFileSync(path.join(fixtureDir, 'public', 'sitemap.xml'), 'utf-8')
    expect(index).toContain('<loc>https://supabase.com/sitemap_www.xml</loc>')
    expect(index).toContain('<loc>https://supabase.com/docs/sitemap.xml</loc>')
  })
})

describe('generate-sitemap rejects dates it cannot trust', () => {
  const cases: Array<{ name: string; files: Record<string, string>; stderrIncludes: string[] }> = [
    {
      name: 'a non-date word',
      files: blogFixture('2026-01-10-bad-word', "date: '2026-01-10'\nupdated: 'soon'"),
      stderrIncludes: ['_blog/2026-01-10-bad-word.mdx', '"soon"'],
    },
    {
      name: 'trailing text after a valid day',
      files: blogFixture('2026-01-11-bad-suffix', "date: '2026-01-11'\nupdated: '2026-01-11soon'"),
      stderrIncludes: ['_blog/2026-01-11-bad-suffix.mdx', '"2026-01-11soon"'],
    },
    {
      name: 'a day that does not exist',
      files: blogFixture('2026-01-12-bad-day', "date: '2026-01-12'\nupdated: '2026-02-30'"),
      stderrIncludes: ['_blog/2026-01-12-bad-day.mdx', '"2026-02-30"'],
    },
    {
      name: 'a month that does not exist',
      files: blogFixture('2026-01-13-bad-month', "date: '2026-01-13'\nupdated: '2026-13-45'"),
      stderrIncludes: ['_blog/2026-01-13-bad-month.mdx', '"2026-13-45"'],
    },
    {
      name: 'an unquoted value carrying a time part',
      files: blogFixture(
        '2026-01-14-unquoted-time',
        "date: '2026-01-14'\nupdated: 2026-01-14T09:30:00"
      ),
      stderrIncludes: ['_blog/2026-01-14-unquoted-time.mdx', 'quote it'],
    },
    {
      name: 'an unparseable changelog pubDate',
      files: { 'public/changelog-rss.xml': rss([rssItem(LEGACY_LINK, 'Invalid Date +0000')]) },
      stderrIncludes: [`changelog-rss ${LEGACY_LINK}`, '"Invalid Date +0000"'],
    },
  ]

  for (const testCase of cases) {
    it(
      `fails the build on ${testCase.name}`,
      () => {
        const result = runGenerator(writeFixture(testCase.files))
        expect(result.status).not.toBe(0)
        for (const fragment of testCase.stderrIncludes) {
          expect(result.stderr).toContain(fragment)
        }
      },
      SPAWN_TIMEOUT_MS
    )
  }
})
