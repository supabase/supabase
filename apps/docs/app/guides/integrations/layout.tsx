import { IS_PLATFORM } from 'common'
import { unstable_cache } from 'next/cache'
import { type NavMenuSection } from '~/components/Navigation/Navigation.types'
import { REVALIDATION_TAGS } from '~/features/helpers.fetch'
import Layout from '~/layouts/guides'
import { supabaseMisc } from '~/lib/supabaseMisc'

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

  const { data, error } = await supabaseMisc()
    .from('partners')
    .select('slug, title')
    .eq('approved', true)
    .eq('type', 'technology')
    .order('title')
  if (error) {
    console.error(new Error('Error fetching partners', { cause: error }))
  }

  const partnerNavItems = (data ?? []).map(
    (partner) =>
      ({
        name: partner.title,
        url: `https://supabase.com/partners/integrations/${partner.slug}` as `https://${string}`,
      }) as Partial<NavMenuSection>
  )

  return partnerNavItems
}
