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
    built_by,
    description,
    content,
    website_url,
    documentation_url,
    marketplace_url,
    listing_logo,
    images,
    youtube_id,
  } = listing
  return {
    categories,
    featured,
    // The view definition only returns tech partners
    type: 'technology',
    slug,
    title,
    builtBy: built_by,
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

async function getMarketplaceListings(): Promise<Partner[]> {
  const { data } = await marketplaceClient
    .from('listings')
    .select('*')
    .not('published_in_catalog_at', 'is', null)

  return data?.map(toPartner) ?? []
}

/**
 * Lists all partner marketplace entries for the public website, from the configured database.
 */
export async function listPartners(): Promise<Partner[]> {
  if (isUseMarketplaceDb) {
    return getMarketplaceListings()
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

async function getMarketplaceListingSlugs(): Promise<string[]> {
  const { data } = await marketplaceClient
    .from('listings')
    .select('slug')
    .not('published_in_catalog_at', 'is', null)

  return data?.map((row) => row.slug) ?? []
}

/**
 * Lists all available partner marketplace listing slugs, from the configured database.
 */
export async function listPartnerSlugs(): Promise<string[]> {
  if (isUseMarketplaceDb) {
    return getMarketplaceListingSlugs()
  } else {
    const { data } = await supabase
      .from('partners')
      .select('slug')
      .eq('approved', true)
      .eq('type', 'technology')

    return data?.map((row) => row.slug) ?? []
  }
}

async function searchMarketplaceListings(search: string): Promise<Partner[] | null> {
  const searchTerm = search.trim()
  let query = marketplaceClient
    .from('listings')
    .select('*')
    .not('published_in_catalog_at', 'is', null)

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
    return searchMarketplaceListings(search)
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

async function getMarketplaceListing(slug: string): Promise<Partner | null> {
  const { data } = await marketplaceClient
    .from('listings')
    .select('*')
    .eq('slug', slug)
    .not('published_in_catalog_at', 'is', null)
    .single()

  return data ? toPartner(data) : null
}

/**
 * Get a single partner by slug, from the configured database.
 */
export async function getPartner(slug: string): Promise<Partner | null> {
  if (isUseMarketplaceDb) {
    return getMarketplaceListing(slug)
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
