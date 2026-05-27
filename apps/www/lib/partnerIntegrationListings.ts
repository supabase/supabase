import { PARTNER_INTEGRATION_OVERRIDES } from '~/data/partner-integration-listings'
import type { IntegrationListing, Partner } from '~/types/partners'

/**
 * Derives the list of IntegrationListings for a given partner.
 *
 * The first entry is always a "guide" listing built from the Partner DB record.
 * Additional entries come from PARTNER_INTEGRATION_OVERRIDES (Studio wrappers, templates, etc.).
 * When there is only one listing the detail page renders its content directly (no tabs).
 * When there are multiple listings the detail page renders them as navigable tabs.
 */
export function partnerToIntegrationListings(partner: Partner): IntegrationListing[] {
  const guide: IntegrationListing = {
    slug: 'guide',
    name: 'Guide',
    type: 'guide',
    description: partner.description,
    content: partner.content,
    images: partner.images,
    youtubeId: partner.youtubeId,
    installUrl: partner.installUrl,
    isMarketplace: partner.isMarketplace,
    docsUrl: partner.docsUrl,
  }

  const overrides = PARTNER_INTEGRATION_OVERRIDES[partner.slug] ?? []

  return [guide, ...overrides]
}

/** Returns true when the partner has more than one integration surface. */
export function hasMultipleListings(partnerSlug: string): boolean {
  return (PARTNER_INTEGRATION_OVERRIDES[partnerSlug]?.length ?? 0) > 0
}

/**
 * The set of catalog slugs that have been absorbed as tabs into another partner's page.
 * These slugs may exist as standalone DB entries but should not appear in the catalog list
 * or generate their own static pages — they are reachable only via the parent partner's tab.
 */
export const ABSORBED_SLUGS: ReadonlySet<string> = new Set(
  Object.values(PARTNER_INTEGRATION_OVERRIDES).flatMap((entries) => entries.map((e) => e.slug))
)
