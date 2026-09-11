import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { parseFrontmatter } from './lib/frontmatter.mjs'
import { blogPostingSchema, serializeJsonLd } from './lib/json-ld'

const GENERATOR = path.join(process.cwd(), 'internals', 'generate-sitemap.mjs')
const LEGACY_LINK = 'https://supabase.com/changelog/12345-legacy-entry'
const TIMED_LINK = 'https://supabase.com/changelog/23456-timed-entry'
const TEXT_SLUG_LINK = 'https://supabase.com/changelog/text-slug-entry'
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
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>',
    '<link>https://supabase.com/changelog</link>',
    '<atom:link href="https://supabase.com/changelog-rss.xml" rel="self" type="application/rss+xml"/>',
    ...items,
    '</channel></rss>',
    '',
  ].join('\n')
}

function urlEntries(xml: string): UrlEntry[] {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    loc: block.match(/<loc\s*>\s*([^<\s]+)\s*<\/loc\s*>/)![1],
    lastmod: block.match(/<lastmod\s*>\s*([^<\s]+)\s*<\/lastmod\s*>/)?.[1],
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
      'pages/company.tsx': '',
      'public/changelog-rss.xml': rss([
        rssItem(TIMED_LINK, 'Wed, 04 Feb 2026 20:15:00 -0700'),
        rssItem(TEXT_SLUG_LINK, 'Thu, 05 Feb 2026 00:00:00 +0000'),
        rssItem(LEGACY_LINK, 'Tue, 03 Feb 2026 00:00:00 +0000'),
      ]),
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

  it('accepts an unquoted date-only value', () => {
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
      'https://supabase.com/company',
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

  it('truncates a timed, offset pubDate to its UTC day', () => {
    expect(entryFor(TIMED_LINK)?.lastmod).toBe('2026-02-05')
  })

  it('includes changelog entries whose slug has no numeric prefix', () => {
    expect(entryFor(TEXT_SLUG_LINK)?.lastmod).toBe('2026-02-05')
  })

  it('emits exactly the RSS item links as changelog URLs', () => {
    const changelogLocs = entries
      .filter((entry) => entry.loc.startsWith('https://supabase.com/changelog'))
      .map((entry) => entry.loc)
    expect(changelogLocs).toEqual([TIMED_LINK, TEXT_SLUG_LINK, LEGACY_LINK])
  })

  it('emits only day-precision lastmod values, one per dated source', () => {
    const lastmods = entries.map((entry) => entry.lastmod).filter(Boolean)
    expect(lastmods).toHaveLength(10)
    for (const lastmod of lastmods) expect(lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('leaves the sitemap index untouched', () => {
    const index = fs.readFileSync(path.join(fixtureDir, 'public', 'sitemap.xml'), 'utf-8')
    expect(index).toContain('<loc>https://supabase.com/sitemap_www.xml</loc>')
    expect(index).toContain('<loc>https://supabase.com/docs/sitemap.xml</loc>')
  })
})

describe('frontmatter dates in sitemap and blog JSON-LD', () => {
  it.each([
    ['2026-01-14T09:30:00', '2026-01-14'],
    ['2026-01-15T16:00:00-08:00', '2026-01-15'],
    ['2026-01-16T00:00:00Z', '2026-01-16'],
    ['2026-01-17T00:30:00+14:00', '2026-01-17'],
    ['2026-01-18', '2026-01-18'],
  ])('preserves the authored day of %s regardless of quoting', (value, expectedDay) => {
    const files = {
      ...blogFixture('2026-01-01-quoted', `date: '2026-01-01'\nupdated: '${value}'`),
      ...blogFixture('2026-01-01-unquoted', `date: 2026-01-01\nupdated: ${value} # revision`),
    }
    const dir = writeFixture(files)
    const result = runGenerator(dir)
    expect(result.status, result.stderr).toBe(0)
    const entries = urlEntries(fs.readFileSync(path.join(dir, 'public/sitemap_www.xml'), 'utf-8'))
    expect(
      entries.filter((entry) => entry.loc.includes('/blog/')).map((entry) => entry.lastmod)
    ).toEqual([expectedDay, expectedDay])

    for (const content of Object.values(files)) {
      const { data } = parseFrontmatter(content)
      const schema = JSON.parse(
        serializeJsonLd(
          blogPostingSchema({
            url: 'https://supabase.com/blog/example',
            headline: 'Example',
            image: 'https://supabase.com/example.png',
            datePublished: data.date,
            dateModified: data.updated ?? data.date,
            authors: [{ name: 'Supabase' }],
          })
        )
      )
      expect(schema.datePublished).toBe('2026-01-01')
      expect(schema.dateModified).toBe(value)
      expect(schema.dateModified.slice(0, 10)).toBe(expectedDay)
    }
  })

  it.each(['javascript', 'js', 'JavaScript'])(
    'rejects %s frontmatter without executing it',
    (language) => {
      const content = `---${language}\n(require('fs').writeFileSync('executed', 'yes'), {date: '2026-01-01'})\n---\n`
      const dir = writeFixture({ '_blog/2026-01-01-script.mdx': content })
      const result = runGenerator(dir)
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('JavaScript frontmatter is not supported')
      expect(fs.existsSync(path.join(dir, 'executed'))).toBe(false)
      expect(() => parseFrontmatter(content)).toThrow('JavaScript frontmatter is not supported')
    }
  )
})

describe('generate-sitemap rejects dates it cannot trust', () => {
  const cases: Array<{ name: string; files: Record<string, string>; stderrIncludes: string[] }> = [
    {
      name: 'a non-date word',
      files: blogFixture('2026-01-10-bad-word', "date: '2026-01-10'\nupdated: 'soon'"),
      stderrIncludes: ['_blog/2026-01-10-bad-word.mdx', '"soon"'],
    },
    {
      name: 'an updated value earlier than the publish date',
      files: blogFixture('2026-01-17-backdated', "date: '2026-01-17'\nupdated: '2025-12-31'"),
      stderrIncludes: ['_blog/2026-01-17-backdated.mdx', 'earlier than date'],
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
      name: 'a time of day that does not exist',
      files: blogFixture('2026-01-18-bad-time', "date: '2026-01-18'\nupdated: '2026-01-18T99:99'"),
      stderrIncludes: ['_blog/2026-01-18-bad-time.mdx', '"2026-01-18T99:99"'],
    },
    {
      name: 'an offset that does not exist',
      files: blogFixture(
        '2026-01-19-bad-offset',
        "date: '2026-01-19'\nupdated: '2026-01-19T09:30:00+99:00'"
      ),
      stderrIncludes: ['_blog/2026-01-19-bad-offset.mdx', '"2026-01-19T09:30:00+99:00"'],
    },
    {
      name: 'an unparseable changelog pubDate',
      files: { 'public/changelog-rss.xml': rss([rssItem(LEGACY_LINK, 'Invalid Date +0000')]) },
      stderrIncludes: [`changelog-rss ${LEGACY_LINK}`, '"Invalid Date +0000"'],
    },
    {
      name: 'an unparseable changelog pubDate on a text-slug entry',
      files: { 'public/changelog-rss.xml': rss([rssItem(TEXT_SLUG_LINK, 'Invalid Date +0000')]) },
      stderrIncludes: [`changelog-rss ${TEXT_SLUG_LINK}`, '"Invalid Date +0000"'],
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

describe('generate-sitemap against the repo content', () => {
  const wwwRoot = process.cwd()
  const mdxCount = (dir: string) =>
    fs.readdirSync(path.join(wwwRoot, dir)).filter((name) => name.endsWith('.mdx')).length

  it(
    'dates every blog, alternatives, and customers file without throwing',
    () => {
      const result = runGenerator(wwwRoot)
      expect(result.status, result.stderr).toBe(0)
      const entries = urlEntries(
        fs.readFileSync(path.join(wwwRoot, 'public', 'sitemap_www.xml'), 'utf-8')
      )
      const datedContent = entries.filter(
        (entry) => entry.lastmod && !entry.loc.includes('/changelog/')
      )
      expect(datedContent).toHaveLength(
        mdxCount('_blog') + mdxCount('_alternatives') + mdxCount('_customers')
      )
      expect(
        entries.filter((entry) => entry.loc.includes('/events/') && entry.lastmod)
      ).toHaveLength(0)
    },
    SPAWN_TIMEOUT_MS
  )
})
