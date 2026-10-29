import { beforeEach, describe, expect, it, vi } from 'vitest'

import sitemap from './sitemap'

const { listCatalogPartnerSlugs } = vi.hoisted(() => ({ listCatalogPartnerSlugs: vi.fn() }))
vi.mock('~/lib/marketplaceDb', () => ({ listCatalogPartnerSlugs }))

describe('partner catalog sitemap', () => {
  beforeEach(() => listCatalogPartnerSlugs.mockReset())

  it('lists one sorted URL per catalog partner slug', async () => {
    listCatalogPartnerSlugs.mockResolvedValue(['stripe', 'bigquery', 'clerk'])

    expect((await sitemap()).map((entry) => entry.url)).toEqual([
      'https://supabase.com/partners/catalog/bigquery',
      'https://supabase.com/partners/catalog/clerk',
      'https://supabase.com/partners/catalog/stripe',
    ])
  })

  it('URL-encodes slugs', async () => {
    listCatalogPartnerSlugs.mockResolvedValue(['a b'])

    expect((await sitemap())[0].url).toBe('https://supabase.com/partners/catalog/a%20b')
  })

  it('returns an empty sitemap when there are no catalog partners', async () => {
    listCatalogPartnerSlugs.mockResolvedValue([])

    expect(await sitemap()).toEqual([])
  })
})
