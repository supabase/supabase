import { toPartner as miscDbToPartner, Partner } from '~/types/partners'
import { createMarketplaceClient, fullImageUrl, type Listing } from 'common/marketplace-client'

import supabase from './supabaseMisc'

// Switch between new Marketplace DB and legacy Supabase Misc DB by updating the environment var
// in the Vercel deployment and redeploying, as that will take effect more quickly than flipping a
// feature flag in ConfigCat and waiting for the revalidate timeout.
const isUseMarketplaceDb = process.env.INTEGRATIONS_MARKETPLACE_DB?.toLowerCase() === 'true'

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
  } = listing
  return {
    categories,
    featured,
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

async function getMarketplaceListings(): Promise<Partner[]> {
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
