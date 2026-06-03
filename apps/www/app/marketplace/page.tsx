import { listCatalogPartners } from '~/lib/marketplaceDb'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import MarketplaceLandingContent from './MarketplaceLandingContent'

export const revalidate = 1800

const META_TITLE = 'Supabase Integrations Marketplace'
const META_DESCRIPTION =
  'Explore, install, and manage native and third-party integrations directly from your Supabase project — observability, security, secrets, email, and more.'

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  openGraph: {
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: 'https://supabase.com/marketplace',
    images: [{ url: 'https://supabase.com/images/og/integrations.png' }],
  },
}

export default async function MarketplacePage() {
  const allPartners = await listCatalogPartners()
  const marketplaceIntegrations = allPartners.filter((p) => p.publishedInMarketplace)

  return (
    <Suspense>
      <MarketplaceLandingContent integrations={marketplaceIntegrations} />
    </Suspense>
  )
}
