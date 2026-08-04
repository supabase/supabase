import { listCatalogPartners } from '~/lib/marketplaceDb'
import type { Metadata } from 'next'
import { Suspense } from 'react'

import IntegrationsContent from './IntegrationsContent'

export const revalidate = 1800 // 30 minutes

const META_TITLE = 'Partners building with Supabase'
const META_DESCRIPTION =
  'Browse companies that build on Supabase, integrate with Supabase, or both.'

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  openGraph: {
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: 'https://supabase.com/partners/catalog',
    images: [{ url: 'https://supabase.com/images/og/integrations.png' }],
  },
}

export default async function IntegrationPartnersPage() {
  const partners = await listCatalogPartners()

  return (
    <Suspense>
      <IntegrationsContent
        initialPartners={partners}
        metaTitle={META_TITLE}
        metaDescription={META_DESCRIPTION}
      />
    </Suspense>
  )
}
