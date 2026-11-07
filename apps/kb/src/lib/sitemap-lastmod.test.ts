import { readdir } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSitemapLastmods } from './sitemap-lastmod'
import { getEntryMetadataBySlug } from './troubleshooting-db'

vi.mock('./troubleshooting-db', () => ({
  getEntryMetadataBySlug: vi.fn(),
}))

// troubleshooting is fetched at prebuild and isn't checked in, so its folder
// listing is stubbed here instead of reading the real (empty) directory.
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  return { ...actual, readdir: vi.fn(actual.readdir) }
})

const KB = 'https://supabase.com/kb'

describe('getSitemapLastmods', () => {
  beforeEach(() => {
    vi.mocked(getEntryMetadataBySlug).mockReset()
    vi.mocked(getEntryMetadataBySlug).mockResolvedValue(new Map())
  })

  it('reads lastEdited from guide frontmatter as a calendar day', async () => {
    const lastmods = await getSitemapLastmods()

    expect(lastmods.get(`${KB}/guides/migrate-from-auth0`)).toBe('2026-09-24')
  })

  it('looks up every troubleshooting slug in a single database call', async () => {
    const realReaddir = (
      await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
    ).readdir
    vi.mocked(readdir).mockImplementation((dir, options) =>
      String(dir).endsWith('/troubleshooting')
        ? (Promise.resolve(['42501--permission-denied.md', 'other.mdx']) as never)
        : (realReaddir as typeof readdir)(dir, options)
    )
    vi.mocked(getEntryMetadataBySlug).mockResolvedValue(
      new Map([['42501--permission-denied', { dateUpdated: new Date('2026-10-01T00:00:00Z') }]])
    )

    const lastmods = await getSitemapLastmods()

    expect(getEntryMetadataBySlug).toHaveBeenCalledTimes(1)
    expect(vi.mocked(getEntryMetadataBySlug).mock.calls[0][0]).toEqual([
      '42501--permission-denied',
      'other',
    ])
    expect(lastmods.get(`${KB}/troubleshooting/42501--permission-denied`)).toBe('2026-10-01')
    expect(lastmods.has(`${KB}/troubleshooting/other`)).toBe(false)
  })
})
