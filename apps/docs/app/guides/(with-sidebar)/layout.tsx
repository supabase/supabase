import { type PropsWithChildren } from 'react'

import { supabaseMisc } from '~/lib/supabaseMisc'
import Layout from '~/layouts/guides'

const GuidesLayout = async ({ children }: PropsWithChildren) => {
  const partners = await getPartners()
  const partnerNavItems = partners.map((partner) => ({
    name: partner.title,
    url: `https://supabase.com/partners/integrations/${partner.slug}` as `https://${string}`,
  }))

  return <Layout additionalNavItems={partnerNavItems}>{children}</Layout>
}

async function getPartners() {
  const { data, error } = await supabaseMisc()
    .from('partners')
    .select('slug, title')
    .eq('type', 'technology')
    .order('title')
  if (error) {
    console.error(new Error('Error fetching partners', { cause: error }))
  }

  return data ?? []
}

export default GuidesLayout
