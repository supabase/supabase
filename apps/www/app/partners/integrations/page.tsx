import supabase from '~/lib/supabaseMisc'
import type { Partner } from '~/types/partners'
import type { Metadata } from 'next'

import IntegrationsContent from './IntegrationsContent'

export const revalidate = 1800 // 30 minutes

const META_TITLE = 'Find an Integration'
const META_DESCRIPTION = 'Use your favorite tools with Supabase.'

export const metadata: Metadata = {
  title: META_TITLE,
  description: META_DESCRIPTION,
  openGraph: {
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: 'https://supabase.com/partners/integrations',
    images: [{ url: 'https://supabase.com/images/og/integrations.png' }],
  },
}

export default async function IntegrationPartnersPage() {
  const { data: partners } = await supabase
    .from('partners')
    .select('*')
    .eq('approved', true)
    .eq('type', 'technology')
    .order('category')
    .order('title')

  return (
    <IntegrationsContent
      initialPartners={(partners ?? []) as Partner[]}
      metaTitle={META_TITLE}
      metaDescription={META_DESCRIPTION}
    />
  )
}
