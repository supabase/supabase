import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ingestMarkdown } from './ingest'

type Call = { method: string; args: unknown[] }

// Records the chained query builder calls so a test can read them back in order
function createFakeSupabase(removedRows: { slug: string }[] = []) {
  const queries: Call[][] = []

  const from = vi.fn(() => {
    const calls: Call[] = []
    queries.push(calls)
    const builder: Record<string, unknown> = {
      then: (resolve: (value: unknown) => void) =>
        resolve({
          data: calls.some(({ method }) => method === 'select') ? removedRows : null,
          error: null,
        }),
    }
    for (const method of ['delete', 'insert', 'eq', 'lt', 'like', 'select']) {
      builder[method] = (...args: unknown[]) => {
        calls.push({ method, args })
        return builder
      }
    }
    return builder
  })

  return { supabase: { from } as unknown as SupabaseClient, queries }
}

describe('ingestMarkdown', () => {
  let contentRoot: string

  beforeEach(async () => {
    contentRoot = await mkdtemp(path.join(tmpdir(), 'docs-search-ingest-'))
    await mkdir(path.join(contentRoot, 'guides'))
    await writeFile(path.join(contentRoot, 'guides', 'auth.md'), '# Auth\n\nHello\n')
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await rm(contentRoot, { recursive: true, force: true })
  })

  it('replaces the rows of each ingested page', async () => {
    const { supabase, queries } = createFakeSupabase()

    await ingestMarkdown({ supabase, contentRoot, table: 'docs' })

    expect(queries[0]).toEqual([
      { method: 'delete', args: [] },
      { method: 'eq', args: ['slug', 'guides/auth'] },
    ])
    expect(queries[1][0].method).toBe('insert')
  })

  it('removes rows that were not touched by this run, after ingesting', async () => {
    const { supabase, queries } = createFakeSupabase([{ slug: 'guides/deleted' }])
    const before = Date.now()

    await ingestMarkdown({ supabase, contentRoot, table: 'docs' })

    const cleanup = queries[queries.length - 1]
    expect(cleanup.map(({ method }) => method)).toEqual(['delete', 'lt', 'select'])
    const [column, cutoff] = cleanup[1].args as [string, string]
    expect(column).toBe('updated_at')
    expect(new Date(cutoff).getTime()).toBeLessThanOrEqual(before)
  })

  it('only removes stale rows under the slug prefix', async () => {
    const { supabase, queries } = createFakeSupabase()

    await ingestMarkdown({ supabase, contentRoot, table: 'kb', slugPrefix: 'kb_100%/' })

    const cleanup = queries[queries.length - 1]
    expect(cleanup.find(({ method }) => method === 'like')?.args).toEqual(['slug', 'kb\\_100\\%/%'])
  })

  it('does not touch the table when there is no content', async () => {
    const empty = await mkdtemp(path.join(tmpdir(), 'docs-search-empty-'))
    const { supabase, queries } = createFakeSupabase()

    await expect(ingestMarkdown({ supabase, contentRoot: empty, table: 'docs' })).resolves.toBe(0)

    expect(queries).toHaveLength(0)
    await rm(empty, { recursive: true, force: true })
  })
})
