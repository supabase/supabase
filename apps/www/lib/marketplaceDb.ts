import {
  ListingDetail,
  toPartner as miscDbToPartner,
  Partner,
  type Category,
} from '~/types/partners'
import { createMarketplaceClient, fullImageUrl, type Listing } from 'common/marketplace-client'

import supabase from './supabaseMisc'

// Switch between new Marketplace DB and legacy Supabase Misc DB by updating the environment var
// in the Vercel deployment and redeploying, as that will take effect more quickly than flipping a
// feature flag in ConfigCat and waiting for the revalidate timeout.
export const isUseMarketplaceDb =
  process.env.NEXT_PUBLIC_INTEGRATIONS_MARKETPLACE_DB?.toLowerCase() === 'true'

const marketplaceClient = createMarketplaceClient()

// Supabase-owned listings that are remapped to appear as independent partners in the catalog.
// The key is the listing slug; the value is the partner name to display.
const SUPABASE_PARTNER_SLUG = 'supabase'

// Key = listing DB slug; Value = { display name, clean URL slug for the catalog page }
const SUPABASE_LISTING_OVERRIDES: Record<string, { name: string; slug: string }> = {
  'bigquery-wrapper': { name: 'BigQuery', slug: 'bigquery' },
  'firebase-wrapper': { name: 'Firebase', slug: 'firebase' },
  'stripe-wrapper': { name: 'Stripe', slug: 'stripe' },
  vercel: { name: 'Vercel', slug: 'vercel' },
  cyberduck: { name: 'Cyberduck', slug: 'cyberduck' },
}

// URL-facing slugs for overridden listings (e.g. 'bigquery', 'firebase', 'stripe').
const OVERRIDE_URL_SLUGS = new Set(Object.values(SUPABASE_LISTING_OVERRIDES).map((o) => o.slug))
// Reverse map: URL slug → listing DB slug (e.g. 'bigquery' → 'bigquery-wrapper').
const URL_SLUG_TO_LISTING: Record<string, string> = Object.fromEntries(
  Object.entries(SUPABASE_LISTING_OVERRIDES).map(([listingSlug, { slug }]) => [slug, listingSlug])
)

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

  // Check listing.slug first so the override works regardless of what partner_slug the DB has.
  const overriddenListings = new Map<string, Listing>()
  const byPartnerSlug = new Map<string, Listing[]>()

  for (const listing of listingsData ?? []) {
    if (listing.slug in SUPABASE_LISTING_OVERRIDES) {
      overriddenListings.set(listing.slug, listing)
      continue
    }

    const slug = listing.partner_slug
    if (!slug || slug === SUPABASE_PARTNER_SLUG) continue

    const arr = byPartnerSlug.get(slug) ?? []
    arr.push(listing)
    byPartnerSlug.set(slug, arr)
  }

  // Exclude 'supabase' and any partner whose URL slug is covered by an override.
  const regularPartners = partnersData
    .filter((p) => p.slug && p.slug !== SUPABASE_PARTNER_SLUG && !OVERRIDE_URL_SLUGS.has(p.slug))
    .flatMap((p) => {
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

  const virtualPartners = Array.from(overriddenListings.entries()).map(([listingSlug, listing]) => {
    const override = SUPABASE_LISTING_OVERRIDES[listingSlug]
    return buildPartner(
      {
        slug: override.slug,
        name: override.name,
        description: listing.description,
        logo: listing.listing_logo,
        website: listing.website_url,
        type: 'technology',
      },
      [listing]
    )
  })

  return [...regularPartners, ...virtualPartners]
}

/**
 * Derives a human-readable tab label from a listing's metadata.
 * Priority: one-click install → Foreign Data Wrapper → plain integration → guide/overview.
 */
function getLabelForListing(listing: Listing): string {
  if (listing.publish_dashboard) return 'Marketplace Integration'
  const isFdw = listing.categories?.some(
    (c) =>
      c.name.toLowerCase().includes('foreign data wrapper') || c.slug.toLowerCase().includes('fdw')
  )
  if (isFdw) return 'Foreign Data Wrapper'
  if (listing.marketplace_url) return 'Integration'
  return 'Guide'
}

/**
 * Marketplace DB: get a single partner by partner slug, including all their listings as tabs.
 */
async function getPartnerFromMarketplace(slug: string): Promise<Partner | null> {
  // 'supabase' never appears directly as a catalog partner
  if (slug === SUPABASE_PARTNER_SLUG) return null

  // Supabase-owned listings remapped to independent partners.
  // Accept both the clean URL slug ('bigquery') and the listing DB slug ('bigquery-wrapper').
  const listingSlugForOverride =
    URL_SLUG_TO_LISTING[slug] ?? (slug in SUPABASE_LISTING_OVERRIDES ? slug : null)

  if (listingSlugForOverride) {
    const override = SUPABASE_LISTING_OVERRIDES[listingSlugForOverride]
    const { data: listing } = await marketplaceClient
      .from('listings')
      .select('*')
      .eq('slug', listingSlugForOverride)
      .maybeSingle()

    if (!listing) return null

    return {
      ...buildPartner(
        {
          slug: override.slug,
          name: override.name,
          description: listing.description,
          logo: listing.listing_logo,
          website: listing.website_url,
          type: 'technology',
        },
        [listing]
      ),
      listings: [
        {
          slug: listing.slug,
          label: getLabelForListing(listing),
          content: listing.content,
          installUrl: listing.marketplace_url ?? null,
          dashboardUrl: listing.publish_dashboard
            ? `https://supabase.com/dashboard/project/_/integrations/${listing.slug}/overview`
            : null,
          docsUrl: listing.documentation_url || null,
          images: listing.images?.map(fullImageUrl) ?? [],
          youtubeId: listing.youtube_id ?? null,
        },
      ],
    }
  }

  const [{ data: partnerData }, { data: listingsData }] = await Promise.all([
    marketplaceClient.from('partners').select('*').eq('slug', slug).maybeSingle(),
    marketplaceClient.from('listings').select('*').eq('partner_slug', slug),
  ])

  const partnerSlug = partnerData?.slug
  if (!partnerSlug) return null

  const listings = listingsData ?? []

  const listingDetails: ListingDetail[] = listings.map((listing) => ({
    slug: listing.slug,
    label: getLabelForListing(listing),
    content: listing.content,
    installUrl: listing.marketplace_url ?? null,
    docsUrl: listing.documentation_url || null,
    images: listing.images?.map(fullImageUrl) ?? [],
    youtubeId: listing.youtube_id ?? null,
  }))

  return {
    ...buildPartner(
      {
        slug: partnerSlug,
        name: partnerData.name,
        description: partnerData.description,
        logo: partnerData.logo,
        website: partnerData.website,
        type: partnerData.type,
      },
      listings
    ),
    listings: listingDetails,
  }
}

/**
 * Marketplace DB: list all partner slugs (for static path generation).
 * Excludes 'supabase'; adds the remapped listing slugs instead.
 */
async function getPartnerSlugsFromMarketplace(): Promise<string[]> {
  const [{ data: partnerRows }, { data: overriddenRows }] = await Promise.all([
    marketplaceClient.from('partners').select('slug').neq('slug', SUPABASE_PARTNER_SLUG),
    // Fetch overridden listing slugs directly by listing slug (not by partner_slug).
    marketplaceClient
      .from('listings')
      .select('slug')
      .in('slug', Object.keys(SUPABASE_LISTING_OVERRIDES)),
  ])

  // Exclude any partner whose URL slug is covered by an override.
  const partnerSlugs =
    partnerRows?.flatMap((row) =>
      row.slug && !OVERRIDE_URL_SLUGS.has(row.slug) ? [row.slug] : []
    ) ?? []
  // Map each listing DB slug to its clean URL slug (e.g. 'bigquery-wrapper' → 'bigquery').
  const overriddenSlugs =
    overriddenRows?.flatMap((row) => {
      const override = row.slug ? SUPABASE_LISTING_OVERRIDES[row.slug] : null
      return override ? [override.slug] : []
    }) ?? []
  return [...partnerSlugs, ...overriddenSlugs]
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

  // Use clean URL slug as map key for overridden listings.
  const byPartnerSlug = new Map<string, Listing[]>()
  for (const listing of data ?? []) {
    if (listing.slug in SUPABASE_LISTING_OVERRIDES) {
      byPartnerSlug.set(SUPABASE_LISTING_OVERRIDES[listing.slug].slug, [listing])
      continue
    }

    const slug = listing.partner_slug
    if (!slug || slug === SUPABASE_PARTNER_SLUG) continue

    const arr = byPartnerSlug.get(slug) ?? []
    arr.push(listing)
    byPartnerSlug.set(slug, arr)
  }

  return Array.from(byPartnerSlug.entries()).map(([partnerSlug, listings]) => {
    const first = listings[0]
    const listingSlug = URL_SLUG_TO_LISTING[partnerSlug]
    const isOverridden = !!listingSlug
    return buildPartner(
      {
        slug: partnerSlug,
        name: isOverridden ? SUPABASE_LISTING_OVERRIDES[listingSlug].name : first.partner_name,
        description: first.description,
        logo: isOverridden ? first.listing_logo : (first.partner_logo ?? first.listing_logo),
        website: first.website_url,
        type: 'technology',
      },
      listings
    )
  })
}

// ---------------------------------------------------------------------------
// Catalog API — always uses the marketplace DB directly, independent of isUseMarketplaceDb.
// The Partner Catalog is a marketplace-specific feature; the legacy misc DB does not carry
// the listings (BigQuery/Firebase/Stripe FDW integrations, etc.) that the catalog needs.
// ---------------------------------------------------------------------------

export const listCatalogPartners = getPartnersFromMarketplace
export const searchCatalogPartners = searchPartnersFromMarketplace
export const getCatalogPartner = getPartnerFromMarketplace
export const listCatalogPartnerSlugs = getPartnerSlugsFromMarketplace

// ---------------------------------------------------------------------------
// Public API — respects isUseMarketplaceDb for non-catalog pages (e.g. /partners/integrations).
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
