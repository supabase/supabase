import { type NavMenuSection } from '~/components/Navigation/Navigation.types'
import { REVALIDATION_TAGS } from '~/features/helpers.fetch'
import Layout from '~/layouts/guides'
import { IS_PLATFORM } from 'common'
import { createMarketplaceClient, type CatalogListing } from 'common/marketplace-client'
import { unstable_cache } from 'next/cache'

export default async function IntegrationsLayout({ children }: { children: React.ReactNode }) {
  const additionalNavItems = { integrations: await getPartners() }
  console.log('IntegrationsLayout additionalNavItems', additionalNavItems)

  return <Layout additionalNavItems={additionalNavItems}>{children}</Layout>
}

// Will need to turn on revalidation later, just turning it off for now so we
// can slowly turn things back on while monitoring usage
const getPartners = unstable_cache(getPartnersImpl, [], {
  tags: [REVALIDATION_TAGS.PARTNERS],
})

// 'supabase' never appears as its own catalog partner; some of its listings are remapped to
// independent partners (BigQuery, Firebase, Stripe wrapper, Vercel, Cyberduck) in the Partner
// Catalog. Those are already covered by their own dedicated nav sections (Foreign Data Wrappers,
// Vercel Marketplace), so they're excluded here to avoid duplicate entries. Keep this list in
// sync with SUPABASE_LISTING_OVERRIDES in apps/www/lib/marketplaceDb.ts.
const SUPABASE_PARTNER_SLUG = 'supabase'
const SUPABASE_OWNED_LISTING_SLUGS = new Set([
  'bigquery-wrapper',
  'firebase-wrapper',
  'stripe-wrapper',
  'vercel',
  'cyberduck',
])

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

  const listingsByPartnerSlug = new Map<string, CatalogListing[]>()
  for (const listing of listings ?? []) {
    const partnerSlug = listing.partner_slug
    if (
      !listing.slug ||
      !partnerSlug ||
      partnerSlug === SUPABASE_PARTNER_SLUG ||
      SUPABASE_OWNED_LISTING_SLUGS.has(listing.slug) ||
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
  const partnerNavItems: Partial<NavMenuSection>[] = Array.from(listingsByPartnerSlug.entries())
    .flatMap(([partnerSlug, partnerListings]) => {
      const partnerName = partnerNameBySlug.get(partnerSlug) ?? partnerSlug
      const catalogUrl = `https://supabase.com/partners/catalog/${partnerSlug}`

      if (partnerListings.length === 1) {
        return [{ name: partnerName, url: catalogUrl as `https://${string}` }]
      }

      return partnerListings.map((listing) => ({
        name: `${partnerName} (${listing.title || listing.slug})`,
        url: `${catalogUrl}?tab=${listing.slug}` as `https://${string}`,
      }))
    })
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))

  return partnerNavItems
}
