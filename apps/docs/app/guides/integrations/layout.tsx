import { type NavMenuSection } from '~/components/Navigation/Navigation.types'
import { REVALIDATION_TAGS } from '~/features/helpers.fetch'
import Layout from '~/layouts/guides'
import { IS_PLATFORM } from 'common'
import {
  createMarketplaceClient,
  SUPABASE_LISTING_OVERRIDES,
  SUPABASE_PARTNER_SLUG,
  type CatalogListing,
} from 'common/marketplace-client'
import { unstable_cache } from 'next/cache'

export default async function IntegrationsLayout({ children }: { children: React.ReactNode }) {
  const additionalNavItems = { integrations: await getPartners() }

  return <Layout additionalNavItems={additionalNavItems}>{children}</Layout>
}

// Will need to turn on revalidation later, just turning it off for now so we
// can slowly turn things back on while monitoring usage
const getPartners = unstable_cache(getPartnersImpl, [], {
  tags: [REVALIDATION_TAGS.PARTNERS],
})

async function getPartnersImpl() {
  if (!IS_PLATFORM) return []

  const marketplaceClient = createMarketplaceClient()

  const [{ data: partners, error }, { data: listings }] = await Promise.all([
    marketplaceClient.from('partners').select('slug, name, type'),
    marketplaceClient.from('catalog_listings').select('*'),
  ])
  if (error) {
    console.error(new Error('Error fetching partners', { cause: error }))
  }

  // Only "technology" partners belong in this list, not agencies/experts.
  const technologyPartnerSlugs = new Set<string>()
  const partnerNameBySlug = new Map<string, string>()
  for (const partner of partners ?? []) {
    if (!partner.slug) continue
    partnerNameBySlug.set(partner.slug, partner.name ?? partner.slug)
    if (partner.type === 'technology') technologyPartnerSlugs.add(partner.slug)
  }

  // Supabase-owned listings still get their own nav item, at their clean catalog page slug.
  const supabaseOwnedNavItems: Partial<NavMenuSection>[] = []
  const listingsByPartnerSlug = new Map<string, CatalogListing[]>()

  for (const listing of listings ?? []) {
    if (!listing.slug) continue

    const override = SUPABASE_LISTING_OVERRIDES[listing.slug]
    if (override) {
      supabaseOwnedNavItems.push({
        name: listing.title || override.name,
        url: `https://supabase.com/partners/catalog/${override.slug}` as `https://${string}`,
      })
      continue
    }

    const partnerSlug = listing.partner_slug
    if (
      !partnerSlug ||
      partnerSlug === SUPABASE_PARTNER_SLUG ||
      !technologyPartnerSlugs.has(partnerSlug)
    ) {
      continue
    }

    const partnerListings = listingsByPartnerSlug.get(partnerSlug) ?? []
    partnerListings.push(listing)
    listingsByPartnerSlug.set(partnerSlug, partnerListings)
  }

  // One nav item per listing (a partner with multiple listings — e.g. an FDW plus a
  // Dashboard Integration — gets one entry per listing), linking straight to the tab
  // that listing occupies on its Partner Catalog page.
  const partnerNavItems: Partial<NavMenuSection>[] = [
    ...Array.from(listingsByPartnerSlug.entries()).flatMap(([partnerSlug, partnerListings]) => {
      const partnerName = partnerNameBySlug.get(partnerSlug) ?? partnerSlug
      const catalogUrl = `https://supabase.com/partners/catalog/${partnerSlug}`

      // Show only listing name if partner has one listing
      if (partnerListings.length === 1) {
        const listingName = partnerListings[0].title || partnerName
        return [{ name: listingName, url: catalogUrl as `https://${string}` }]
      }

      // otherwise show listing name (or slug if no title) plus partner name.
      return partnerListings.map((listing) => ({
        name: `${listing.title || listing.slug} (${partnerName})`,
        url: `${catalogUrl}?tab=${listing.slug}` as `https://${string}`,
      }))
    }),
    ...supabaseOwnedNavItems,
  ]
  partnerNavItems.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))

  return partnerNavItems
}
