import {
  ListingDetail,
  toPartner as miscDbToPartner,
  Partner,
  type Category,
} from '~/types/partners'
import {
  createMarketplaceClient,
  fullImageUrl,
  SUPABASE_LISTING_OVERRIDES,
  SUPABASE_PARTNER_SLUG,
  type CatalogListing,
} from 'common/marketplace-client'

import supabase from './supabaseMisc'

// Switch between new Marketplace DB and legacy Supabase Misc DB by updating the environment var
// in the Vercel deployment and redeploying, as that will take effect more quickly than flipping a
// feature flag in ConfigCat and waiting for the revalidate timeout.
export const isUseMarketplaceDb =
  process.env.NEXT_PUBLIC_INTEGRATIONS_MARKETPLACE_DB?.toLowerCase() === 'true'

const marketplaceClient = createMarketplaceClient()

// URL-facing slugs for overridden listings (e.g. 'bigquery', 'firebase', 'stripe').
const OVERRIDE_URL_SLUGS = new Set(Object.values(SUPABASE_LISTING_OVERRIDES).map((o) => o.slug))
// Reverse map: URL slug → listing DB slug (e.g. 'bigquery' → 'bigquery-wrapper').
const URL_SLUG_TO_LISTING: Record<string, string> = Object.fromEntries(
  Object.entries(SUPABASE_LISTING_OVERRIDES).map(([listingSlug, { slug }]) => [slug, listingSlug])
)

// Only FDW wrappers need the Dashboard Integration treatment (install button + dashboard URL).
const MARKETPLACE_SLUGS = ['bigquery-wrapper', 'firebase-wrapper', 'stripe-wrapper']

/** Returns true if a listing is in the Supabase Marketplace. */
export function isMarketplaceListing(listing: CatalogListing): boolean {
  if (MARKETPLACE_SLUGS.includes(listing.slug)) return true
  return false
}

// Partners whose catalog pages are not yet ready to launch.
// Excluded from listing, detail, slug generation, and search.
const PRE_LAUNCH_CATALOG_BLOCKLIST = new Set<string>([])

/** Returns true if a listing is a Foreign Data Wrapper (FDW). */
function isFdwListing(listing: CatalogListing): boolean {
  return !!listing.categories?.some(
    (c) =>
      c.name.toLowerCase().includes('foreign data wrapper') || c.slug.toLowerCase().includes('fdw')
  )
}

/** Deduplicates and merges categories from across all of a partner's listings. */
function aggregateCategories(listings: CatalogListing[]): Category[] {
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
 * Prefers a Partner Catalog-published listing, then a Dashboard Integration-published one, then any.
 */
function selectPrimaryListing(listings: CatalogListing[]): CatalogListing | undefined {
  return (
    // The catalog_listings view only returns catalog-published listings now (explicitly so, but that was
    // implicitly the case before) so this doesn't make a ton of sense.
    //listings.find((l) => !!l.published_in_catalog_at) ??
    listings.find((l) => l.published_in_marketplace) ?? listings[0]
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

function buildPartner(row: MarketplacePartnerRow, listings: CatalogListing[]): Partner {
  const primary = selectPrimaryListing(listings)
  return {
    slug: row.slug,
    title: row.name ?? primary?.partner_name ?? '',
    builtBy: row.name ?? primary?.built_by ?? '',
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
    // the new view filters these
    publishedInCatalog: true,
    // FDW listings count as "Available in Marketplace" even without publish_dashboard.
    publishedInMarketplace: listings.some(
      (l) => l.published_in_marketplace || isMarketplaceListing(l)
    ),
  }
}

/**
 * Marketplace DB: list all partners and related listings
 */
async function getPartnersFromMarketplace(): Promise<Partner[]> {
  const [{ data: partnersData }, { data: listingsData }] = await Promise.all([
    marketplaceClient.from('partners').select('*'),
    marketplaceClient.from('catalog_listings').select('*'),
  ])

  if (!partnersData?.length) return []

  // Check listing.slug first so the override works regardless of what partner_slug the DB has.
  const overriddenListings = new Map<string, CatalogListing>()
  const byPartnerSlug = new Map<string, CatalogListing[]>()

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

  // Exclude 'supabase', overridden slugs, pre-launch partners, and partners with no
  // catalog-published listing.
  const regularPartners = partnersData
    .filter(
      (p) =>
        p.slug &&
        p.slug !== SUPABASE_PARTNER_SLUG &&
        !OVERRIDE_URL_SLUGS.has(p.slug) &&
        !PRE_LAUNCH_CATALOG_BLOCKLIST.has(p.slug) &&
        byPartnerSlug.has(p.slug)
    )
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
 * Derives a human-readable tab label from a listing's metadata — always the listing's own
 * title (e.g. "BigQuery Wrapper", "Stripe Sync Engine"), so partners with more than one listing
 * get distinct, identifiable tabs instead of generic "Guide"/"Integration" labels.
 */
function getLabelForListing(listing: CatalogListing): string {
  return listing.title || listing.slug || 'Listing'
}

/**
 * Marketplace DB: get a single partner by partner slug, including all their listings as tabs.
 */
async function getPartnerFromMarketplace(slug: string): Promise<Partner | null> {
  // 'supabase' never appears directly as a catalog partner
  if (slug === SUPABASE_PARTNER_SLUG) return null
  // Partners blocked from the catalog until they're ready to launch
  if (PRE_LAUNCH_CATALOG_BLOCKLIST.has(slug)) return null

  // Supabase-owned listings remapped to independent partners.
  // Accept both the clean URL slug ('bigquery') and the listing DB slug ('bigquery-wrapper').
  const listingSlugForOverride =
    URL_SLUG_TO_LISTING[slug] ?? (slug in SUPABASE_LISTING_OVERRIDES ? slug : null)

  if (listingSlugForOverride) {
    const override = SUPABASE_LISTING_OVERRIDES[listingSlugForOverride]
    const { data: listing } = await marketplaceClient
      .from('catalog_listings')
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
          publishedInMarketplace: listing.published_in_marketplace || isMarketplaceListing(listing),
          installUrl: listing.marketplace_url ?? null,
          dashboardUrl:
            listing.published_in_marketplace || isMarketplaceListing(listing)
              ? `https://supabase.com/dashboard/project/_/integrations/${isFdwListing(listing) ? listing.slug.replaceAll('-', '_') : listing.slug}/overview`
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
    marketplaceClient.from('catalog_listings').select('*').eq('partner_slug', slug),
  ])

  const partnerSlug = partnerData?.slug
  if (!partnerSlug) return null

  const listings = listingsData ?? []
  // No catalog-published listing → this partner isn't part of the catalog.
  if (!listings.length) return null

  const listingDetails: ListingDetail[] = listings.map((listing) => ({
    slug: listing.slug,
    label: getLabelForListing(listing),
    content: listing.content,
    publishedInMarketplace: listing.published_in_marketplace || isMarketplaceListing(listing),
    installUrl: listing.marketplace_url ?? null,
    dashboardUrl:
      listing.published_in_marketplace || isMarketplaceListing(listing)
        ? `https://supabase.com/dashboard/project/_/integrations/${isFdwListing(listing) ? listing.slug.replaceAll('-', '_') : listing.slug}/overview`
        : null,
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
  const [{ data: catalogListingRows }, { data: overriddenRows }] = await Promise.all([
    // Derive partner slugs from catalog-published listings, not the raw partners table —
    // a partner with no catalog-published listing isn't part of the Partner Catalog.
    marketplaceClient.from('catalog_listings').select('partner_slug'),
    // Fetch overridden listing slugs directly by listing slug (not by partner_slug).
    marketplaceClient
      .from('catalog_listings')
      .select('slug')
      .in('slug', Object.keys(SUPABASE_LISTING_OVERRIDES)),
  ])

  // Exclude 'supabase', any slug covered by an override, and pre-launch partners.
  const catalogPartnerSlugs = new Set(
    catalogListingRows?.flatMap((row) => (row.partner_slug ? [row.partner_slug] : [])) ?? []
  )
  const partnerSlugs = Array.from(catalogPartnerSlugs).filter(
    (slug) =>
      slug !== SUPABASE_PARTNER_SLUG &&
      !OVERRIDE_URL_SLUGS.has(slug) &&
      !PRE_LAUNCH_CATALOG_BLOCKLIST.has(slug)
  )
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

  if (!searchTerm) return getPartnersFromMarketplace()

  const searchPattern = `%${searchTerm}%`

  const { data: nameMatchedPartners, error: partnersError } = await marketplaceClient
    .from('partners')
    .select('slug')
    .ilike('name', searchPattern)

  if (partnersError) {
    console.error('Marketplace search error:', partnersError)
    return null
  }

  const nameMatchedSlugs = nameMatchedPartners?.flatMap((p) => (p.slug ? [p.slug] : [])) ?? []

  const orConditions = [
    `title.ilike.${searchPattern}`,
    `description.ilike.${searchPattern}`,
    `partner_name.ilike.${searchPattern}`,
  ]
  if (nameMatchedSlugs.length) {
    orConditions.push(`partner_slug.in.(${nameMatchedSlugs.join(',')})`)
  }

  const { data, error } = await marketplaceClient
    .from('catalog_listings')
    .select('*')
    .or(orConditions.join(','))

  if (error) {
    console.error('Marketplace search error:', error)
    return null
  }

  // Use clean URL slug as map key for overridden listings.
  const byPartnerSlug = new Map<string, CatalogListing[]>()
  for (const listing of data ?? []) {
    if (listing.slug in SUPABASE_LISTING_OVERRIDES) {
      byPartnerSlug.set(SUPABASE_LISTING_OVERRIDES[listing.slug].slug, [listing])
      continue
    }

    const slug = listing.partner_slug
    if (!slug || slug === SUPABASE_PARTNER_SLUG || PRE_LAUNCH_CATALOG_BLOCKLIST.has(slug)) continue

    const arr = byPartnerSlug.get(slug) ?? []
    arr.push(listing)
    byPartnerSlug.set(slug, arr)
  }

  // Fetch partner-level names (which take priority over listing.partner_name, see buildPartner)
  // for every non-overridden partner surfaced above.
  const plainPartnerSlugs = Array.from(byPartnerSlug.keys()).filter(
    (slug) => !URL_SLUG_TO_LISTING[slug]
  )
  const { data: partnerRows } = plainPartnerSlugs.length
    ? await marketplaceClient.from('partners').select('slug, name').in('slug', plainPartnerSlugs)
    : { data: [] }
  const partnerNameBySlug = new Map((partnerRows ?? []).map((p) => [p.slug, p.name]))

  return Array.from(byPartnerSlug.entries()).map(([partnerSlug, listings]) => {
    const first = listings[0]
    const listingSlug = URL_SLUG_TO_LISTING[partnerSlug]
    const isOverridden = !!listingSlug
    return buildPartner(
      {
        slug: partnerSlug,
        name: isOverridden
          ? SUPABASE_LISTING_OVERRIDES[listingSlug].name
          : (partnerNameBySlug.get(partnerSlug) ?? first.partner_name),
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
// The Partner Catalog is backed by the marketplace DB; the legacy misc DB does not carry
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
 * Lists all partner entries for the public website, from the configured database.
 * Returns one entry per partner company, with categories and Dashboard Integration flags
 * aggregated across all of that partner's listings.
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
