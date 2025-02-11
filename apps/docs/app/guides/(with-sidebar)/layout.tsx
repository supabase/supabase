import { cache, type PropsWithChildren } from 'react'

import { IS_PLATFORM } from 'common'

import { NavMenuSection } from '~/components/Navigation/Navigation.types'
import Layout from '~/layouts/guides'
import { supabaseMisc } from '~/lib/supabaseMisc'
import { getAiPrompts } from './getting-started/ai-prompts/[slug]/AiPrompts.utils'

// Revalidate occasionally to pick up changes to partners
// 60 seconds/minute * 60 minutes/hour * 24 hours/day
export const revalidate = 86_400

const GuidesLayout = async ({ children }: PropsWithChildren) => {
  const [partnerNavItems, promptNavItems] = await Promise.all([getPartners(), getPrompts()])

  const additionalNavItems =
    partnerNavItems.length > 0 || promptNavItems.length > 0
      ? { integrations: partnerNavItems, prompts: promptNavItems }
      : undefined

  return <Layout additionalNavItems={additionalNavItems}>{children}</Layout>
}

async function getPrompts() {
  const prompts = await getAiPrompts()
  return prompts.map(
    (prompt) =>
      ({
        name: prompt.heading,
        url: `/guides/getting-started/ai-prompts/${prompt.filename}`,
      }) as Partial<NavMenuSection>
  )
}

const getPartners = cache(getPartnersImpl)
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

export default GuidesLayout
