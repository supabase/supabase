import { cache, type PropsWithChildren } from 'react'

import { IS_PLATFORM } from 'common'

import { supabaseMisc } from '~/lib/supabaseMisc'
import Layout from '~/layouts/guides'

// Revalidate occasionally to pick up changes to partners
// 60 seconds/minute * 60 minutes/hour * 24 hours/day
export const revalidate = 86_400

const GuidesLayout = async ({ children }: PropsWithChildren) => {
  const partners = IS_PLATFORM ? await getPartners() : []
  const partnerNavItems = partners.map((partner) => ({
    name: partner.title,
    url: `https://supabase.com/partners/integrations/${partner.slug}` as `https://${string}`,
  }))

  return <Layout additionalNavItems={partnerNavItems}>{children}</Layout>
}

const getPartners = cache(getPartnersImpl)
async function getPartnersImpl() {
  const { data, error } = await supabaseMisc()
    .from('partners')
    .select('slug, title')
    .eq('approved', true)
    .eq('type', 'technology')
    .order('title')
  if (error) {
    console.error(new Error('Error fetching partners', { cause: error }))
  }

  return data ?? []
}

export default GuidesLayout
