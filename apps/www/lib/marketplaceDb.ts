import { toPartner as miscDbToPartner, Partner, type Category } from '~/types/partners'
import { createMarketplaceClient, fullImageUrl, type Listing } from 'common/marketplace-client'

import supabase from './supabaseMisc'

// Switch between new Marketplace DB and legacy Supabase Misc DB by updating the environment var
// in the Vercel deployment and redeploying, as that will take effect more quickly than flipping a
// feature flag in ConfigCat and waiting for the revalidate timeout.
const isUseMarketplaceDb =
  process.env.NEXT_PUBLIC_INTEGRATIONS_MARKETPLACE_DB?.toLowerCase() === 'true'

const marketplaceClient = createMarketplaceClient()

/** Deduplicates and merges categories from across all of a partner's listings. */
function aggregateCategories(listings: Listing[]): Category[] {
  const seen = new Map<string, Category>()
  for (const listing of listings) {
    for (const cat of listing.categories ?? []) {
      if (!seen.has(cat.slug)) seen.set(cat.slug, { name: cat.name, slug: cat.slug })
    }
  }
  return Array.from(seen.values())
}

/**
 * Picks the listing to use for narrative content (description, docs, images…).
 * Prefers a marketplace-published listing, then a dashboard-published one, then any.
 */
function selectPrimaryListing(listings: Listing[]): Listing | undefined {
  return (
    listings.find((l) => l.publish_marketplace) ??
    listings.find((l) => l.publish_dashboard) ??
    listings[0]
  )
}

type MarketplacePartnerRow = {
  slug: string
  name: string | null
  description: string | null
  logo: string | null
  website: string | null
  type: 'technology' | 'expert' | null
}

function buildPartner(row: MarketplacePartnerRow, listings: Listing[]): Partner {
  const primary = selectPrimaryListing(listings)
  return {
    slug: row.slug,
    title: row.name ?? primary?.partner_name ?? '',
    partnerName: row.name ?? primary?.partner_name ?? '',
    description: row.description ?? primary?.description ?? '',
    content: primary?.content ?? '',
    websiteUrl: row.website ?? primary?.website_url ?? '',
    docsUrl: primary?.documentation_url || null,
    installUrl: primary?.marketplace_url ?? null,
    // Prefer the company logo, fall back to the listing's partner logo, then listing logo
    logo: fullImageUrl(row.logo ?? primary?.partner_logo ?? primary?.listing_logo ?? ''),
    images: primary?.images?.map(fullImageUrl) ?? [],
    youtubeId: primary?.youtube_id ?? null,
    type: row.type ?? 'technology',
    categories: aggregateCategories(listings),
    featured: listings.some((l) => l.featured),
    publishedInCatalog: listings.some((l) => !!l.publish_marketplace),
    publishedInMarketplace: listings.some((l) => !!l.publish_dashboard),
  }
}

/**
 * Marketplace DB: list all partners and related listings
 */
async function getPartnersFromMarketplace(): Promise<Partner[]> {
  const [{ data: partnersData }, { data: listingsData }] = await Promise.all([
    marketplaceClient.from('partners').select('*'),
    marketplaceClient.from('listings').select('*'),
  ])

  if (!partnersData?.length) return []

  const byPartnerSlug = new Map<string, Listing[]>()
  for (const listing of listingsData ?? []) {
    const slug = listing.partner_slug
    if (!slug) continue
    const arr = byPartnerSlug.get(slug) ?? []
    arr.push(listing)
    byPartnerSlug.set(slug, arr)
  }

  return partnersData.flatMap((p) => {
    const slug = p.slug
    if (!slug) return []
    return [
      buildPartner(
        {
          slug,
          name: p.name,
          description: p.description,
          logo: p.logo,
          website: p.website,
          type: p.type,
        },
        byPartnerSlug.get(slug) ?? []
      ),
    ]
  })
}

/**
 * Marketplace DB: get a single partner by partner slug
 */
async function getPartnerFromMarketplace(slug: string): Promise<Partner | null> {
  const [{ data: partnerData }, { data: listingsData }] = await Promise.all([
    marketplaceClient.from('partners').select('*').eq('slug', slug).maybeSingle(),
    marketplaceClient.from('listings').select('*').eq('partner_slug', slug),
  ])

  const partnerSlug = partnerData?.slug
  if (!partnerSlug) return null

  return buildPartner(
    {
      slug: partnerSlug,
      name: partnerData.name,
      description: partnerData.description,
      logo: partnerData.logo,
      website: partnerData.website,
      type: partnerData.type,
    },
    listingsData ?? []
  )
}

/**
 * Marketplace DB: list all partner slugs (for static path generation)
 */
async function getPartnerSlugsFromMarketplace(): Promise<string[]> {
  const { data } = await marketplaceClient.from('partners').select('slug')
  return data?.flatMap((row) => (row.slug ? [row.slug] : [])) ?? []
}

/**
 * Marketplace DB: search (returns one result per partner, not per listing)
 */
async function searchPartnersFromMarketplace(search: string): Promise<Partner[] | null> {
  const searchTerm = search.trim()
  let query = marketplaceClient.from('listings').select('*')

  if (searchTerm) {
    const searchPattern = `%${searchTerm}%`
    query = query.or(
      `title.ilike.${searchPattern},description.ilike.${searchPattern},partner_name.ilike.${searchPattern}`
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('Marketplace search error:', error)
    return null
  }

  // Group matched listings by partner, then build one Partner per company
  const byPartnerSlug = new Map<string, Listing[]>()
  for (const listing of data ?? []) {
    const slug = listing.partner_slug
    if (!slug) continue
    const arr = byPartnerSlug.get(slug) ?? []
    arr.push(listing)
    byPartnerSlug.set(slug, arr)
  }

  return Array.from(byPartnerSlug.entries()).map(([slug, listings]) => {
    const first = listings[0]
    return buildPartner(
      {
        slug,
        name: first.partner_name,
        description: first.description,
        logo: first.partner_logo ?? first.listing_logo,
        website: first.website_url,
        type: 'technology',
      },
      listings
    )
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Lists all partner marketplace entries for the public website, from the configured database.
 * Returns one entry per partner company, with categories and marketplace flags aggregated
 * across all of that partner's listings.
 */
export async function listPartners(): Promise<Partner[]> {
  if (isUseMarketplaceDb) {
    return getPartnersFromMarketplace()
  } else {
    const { data } = await supabase
      .from('partners')
      .select('*')
      .eq('approved', true)
      .eq('type', 'technology')
      .order('category')
      .order('title')

    return data?.map(miscDbToPartner) ?? []
  }
}

/**
 * Lists all available partner slugs, from the configured database.
 * Used for static path generation on the partner detail pages.
 */
export async function listPartnerSlugs(): Promise<string[]> {
  if (isUseMarketplaceDb) {
    return getPartnerSlugsFromMarketplace()
  } else {
    const { data } = await supabase
      .from('partners')
      .select('slug')
      .eq('approved', true)
      .eq('type', 'technology')

    return data?.map((row) => row.slug) ?? []
  }
}

/**
 * Searches for partners, from the configured database.
 * Returns one result per partner company (not per listing).
 */
export async function searchPartners(search: string): Promise<Partner[] | null> {
  if (isUseMarketplaceDb) {
    return searchPartnersFromMarketplace(search)
  } else {
    const searchTerm = search.trim()
    let query = supabase
      .from('partners')
      .select('*')
      .eq('approved', true)
      .order('category')
      .order('title')

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`
      query = query.or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
    }

    const { data: partners, error } = await query

    if (error) {
      console.error('Partners search error:', error)
      return null
    }

    return partners?.map(miscDbToPartner) ?? []
  }
}

/**
 * Get a single partner by slug, from the configured database.
 * For the marketplace DB, slug is the partner slug (not a listing slug).
 */
export async function getPartner(slug: string): Promise<Partner | null> {
  if (isUseMarketplaceDb) {
    return getPartnerFromMarketplace(slug)
  } else {
    const { data } = await supabase
      .from('partners')
      .select('*')
      .eq('type', 'technology')
      .eq('approved', true)
      .eq('slug', slug)
      .single()

    return data ? miscDbToPartner(data) : null
  }
}
