import { describe, expect, it } from 'vitest'

import { buildDocsLlmsTxt, buildLlmsIndexes } from './llms-indexes'

describe('buildLlmsIndexes', () => {
  it('lists each guide page in its section index, linked to its markdown', () => {
    const indexes = buildLlmsIndexes(
      [
        { link: 'guides/auth', title: 'Auth' },
        { link: 'guides/auth/quickstarts/nextjs', title: 'Use Supabase Auth with Next.js' },
        { link: 'guides/storage/uploads', title: 'Uploads' },
      ],
      {}
    )

    const auth = indexes.find((index) => index.path === 'guides/auth')
    expect(indexes.map((index) => index.path)).toEqual(['guides/auth', 'guides/storage'])
    expect(auth?.content).toContain('- [Auth](https://supabase.com/docs/guides/auth.md)')
    expect(auth?.content).toContain(
      '- [Use Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs.md)'
    )
    expect(auth?.content).not.toContain('uploads')
  })

  it('links reference pages to their HTML page', () => {
    const [cli] = buildLlmsIndexes(
      [{ link: 'reference/cli/supabase-db-push', title: 'supabase db push' }],
      {}
    )

    expect(cli.path).toBe('reference/cli')
    expect(cli.content).toContain(
      '- [supabase db push](https://supabase.com/docs/reference/cli/supabase-db-push)\n'
    )
  })

  it('gives each older SDK version its own index', () => {
    const indexes = buildLlmsIndexes(
      [
        { link: 'reference/api/v1-get-project', title: 'Get project' },
        { link: 'reference/javascript/select', title: 'Fetch data' },
        { link: 'reference/javascript/v1/select', title: 'Fetch data', version: 'v1' },
      ],
      {}
    )

    expect(indexes.map((index) => index.path)).toEqual([
      'reference/api',
      'reference/javascript',
      'reference/javascript/v1',
    ])
  })

  it('orders indexes by path, whatever order the pages come in', () => {
    const indexes = buildLlmsIndexes(
      [
        { link: 'reference/javascript/v1/select', title: 'Fetch data', version: 'v1' },
        { link: 'reference/javascript/select', title: 'Fetch data' },
        { link: 'guides/storage', title: 'Storage' },
      ],
      {}
    )

    expect(indexes.map((index) => index.path)).toEqual([
      'guides/storage',
      'reference/javascript',
      'reference/javascript/v1',
    ])
  })

  it('titles a guide section index after its landing page, with an llms.txt structure', () => {
    const [auth] = buildLlmsIndexes(
      [
        { link: 'guides/auth', title: 'Auth' },
        { link: 'guides/auth/passwords', title: 'Password-based Auth' },
      ],
      {}
    )

    expect(auth.title).toBe('Supabase Auth guides')
    expect(auth.content).toBe(
      [
        '# Supabase Auth guides',
        '',
        '> Every page in the Supabase Auth guides, linked to its markdown.',
        '',
        '## Pages',
        '',
        '- [Auth](https://supabase.com/docs/guides/auth.md)',
        '- [Password-based Auth](https://supabase.com/docs/guides/auth/passwords.md)',
        '',
      ].join('\n')
    )
  })

  it('titles reference indexes from the given area titles, naming older versions', () => {
    const indexes = buildLlmsIndexes(
      [
        { link: 'reference/javascript/select', title: 'Fetch data' },
        { link: 'reference/javascript/v1/select', title: 'Fetch data', version: 'v1' },
      ],
      { 'reference/javascript': 'JavaScript' }
    )

    expect(indexes.map((index) => index.title)).toEqual([
      'Supabase JavaScript reference',
      'Supabase JavaScript reference v1',
    ])
    expect(indexes[1].content).toMatch(/^# Supabase JavaScript reference v1\n\n> /)
  })

  it('does not repeat Supabase when the landing page title already starts with it', () => {
    const [platform] = buildLlmsIndexes(
      [{ link: 'guides/platform', title: 'Supabase Platform' }],
      {}
    )

    expect(platform.title).toBe('Supabase Platform guides')
  })

  it('prefixes a page title with its parent section, so repeated titles stay distinct', () => {
    const [js] = buildLlmsIndexes(
      [
        {
          link: 'reference/javascript/file-buckets-createbucket',
          title: 'createBucket',
          parentTitle: 'File Buckets',
        },
        { link: 'reference/javascript/initializing', title: 'Initializing' },
      ],
      {}
    )

    expect(js.content).toContain(
      '- [File Buckets: createBucket](https://supabase.com/docs/reference/javascript/file-buckets-createbucket)\n- [Initializing](https://supabase.com/docs/reference/javascript/initializing)'
    )
  })

  it('escapes brackets in page titles so links stay intact', () => {
    const [realtime] = buildLlmsIndexes(
      [{ link: 'guides/realtime/beta', title: 'Use [beta] Realtime' }],
      {}
    )

    expect(realtime.content).toContain(
      '- [Use \\[beta\\] Realtime](https://supabase.com/docs/guides/realtime/beta.md)'
    )
  })

  it('capitalizes the section name when the section has no landing page', () => {
    const [database] = buildLlmsIndexes([{ link: 'guides/database/tables', title: 'Tables' }], {})

    expect(database.title).toBe('Supabase Database guides')
  })
})

describe('buildDocsLlmsTxt', () => {
  it('links every index under a Guides or Reference heading, after an H1 and summary', () => {
    const indexes = buildLlmsIndexes(
      [
        { link: 'guides/auth', title: 'Auth' },
        { link: 'reference/cli/supabase-db-push', title: 'supabase db push' },
      ],
      { 'reference/cli': 'CLI' }
    )

    expect(buildDocsLlmsTxt(indexes)).toBe(
      [
        '# Supabase Docs',
        '',
        '> Supabase is a Postgres development platform. Each index below lists every page in one area of the docs: a guide section, an SDK, the CLI, or the Management API.',
        '',
        'For the complete documentation in a single file, see https://supabase.com/llms-full.txt. For product overviews and pricing, see the site-wide index at https://supabase.com/llms.txt.',
        '',
        '## Guides',
        '',
        '- [Supabase Auth guides](https://supabase.com/docs/llms/guides/auth.txt)',
        '',
        '## Reference',
        '',
        '- [Supabase CLI reference](https://supabase.com/docs/llms/reference/cli.txt)',
        '',
      ].join('\n')
    )
  })
})

describe('buildDocsLlmsTxt with an unknown area', () => {
  it('throws rather than leaving the index unlinked', () => {
    const indexes = buildLlmsIndexes(
      [{ link: 'troubleshooting/slow-queries', title: 'Slow queries' }],
      {}
    )

    expect(() => buildDocsLlmsTxt(indexes)).toThrow('troubleshooting/slow-queries')
  })
})
