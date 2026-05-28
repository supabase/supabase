import { toPartner as miscDbToPartner, Partner } from '~/types/partners'
import { createMarketplaceClient, fullImageUrl, type Listing } from 'common/marketplace-client'

import supabase from './supabaseMisc'

// Switch between new Marketplace DB and legacy Supabase Misc DB by updating the environment var
// in the Vercel deployment and redeploying, as that will take effect more quickly than flipping a
// feature flag in ConfigCat and waiting for the revalidate timeout.
const isUseMarketplaceDb =
  process.env.NEXT_PUBLIC_INTEGRATIONS_MARKETPLACE_DB?.toLowerCase() === 'true'

const marketplaceClient = createMarketplaceClient()

function toPartner(listing: Listing): Partner {
  const {
    categories,
    featured,
    slug,
    title,
    partner_name,
    description,
    content,
    website_url,
    documentation_url,
    marketplace_url,
    listing_logo,
    images,
    youtube_id,
    publish_dashboard,
  } = listing
  return {
    categories,
    featured,
    publishedInCatalog: !!marketplace_url,
    publishedInMarketplace: !!publish_dashboard,
    // The view definition only returns tech partners
    type: 'technology',
    slug,
    title,
    partnerName: partner_name,
    description,
    content,
    websiteUrl: website_url,
    docsUrl: documentation_url,
    installUrl: marketplace_url,
    logo: fullImageUrl(listing_logo),
    images: images?.map(fullImageUrl) ?? [],
    youtubeId: youtube_id,
  }
}

async function getPartnerListings(): Promise<Partner[]> {
  const { data } = await marketplaceClient
    .from('listings')
    .select('*')
    .is('publish_marketplace', true)

  return data?.map(toPartner) ?? []
}

/**
 * Lists all partner marketplace entries for the public website, from the configured database.
 */
export async function listPartners(): Promise<Partner[]> {
  if (isUseMarketplaceDb) {
    return getPartnerListings()
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

async function getPartnerListingSlugs(): Promise<string[]> {
  const { data } = await marketplaceClient
    .from('listings')
    .select('slug')
    .is('publish_marketplace', true)

  return data?.map((row) => row.slug) ?? []
}

/**
 * Lists all available partner marketplace listing slugs, from the configured database.
 */
export async function listPartnerSlugs(): Promise<string[]> {
  if (isUseMarketplaceDb) {
    return getPartnerListingSlugs()
  } else {
    const { data } = await supabase
      .from('partners')
      .select('slug')
      .eq('approved', true)
      .eq('type', 'technology')

    return data?.map((row) => row.slug) ?? []
  }
}

async function searchPartnerListings(search: string): Promise<Partner[] | null> {
  const searchTerm = search.trim()
  let query = marketplaceClient.from('listings').select('*').is('publish_marketplace', true)

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

  return data?.map(toPartner) ?? []
}

/**
 * Searches for partner marketplace listings, from the configured database.
 */
export async function searchPartners(search: string): Promise<Partner[] | null> {
  if (isUseMarketplaceDb) {
    return searchPartnerListings(search)
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

async function getPartnerListing(slug: string): Promise<Partner | null> {
  const { data } = await marketplaceClient
    .from('listings')
    .select('*')
    .eq('slug', slug)
    .is('publish_marketplace', true)
    .single()

  return data ? toPartner(data) : null
}

/**
 * Get a single partner by slug, from the configured database.
 */
export async function getPartner(slug: string): Promise<Partner | null> {
  if (isUseMarketplaceDb) {
    return getPartnerListing(slug)
  } else {
    let { data } = await supabase
      .from('partners')
      .select('*')
      .eq('type', 'technology')
      .eq('approved', true)
      .eq('slug', slug)
      .single()

    return data ? miscDbToPartner(data) : null
  }
}
