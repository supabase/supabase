import { getCatalogPartner } from '~/lib/marketplaceDb'
import supabase from '~/lib/supabaseMisc'
import { notFound, redirect } from 'next/navigation'

type Params = { slug: string }

export const dynamic = 'force-dynamic'

export default async function PartnerLegacyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params

  const { data: partner } = await supabase
    .from('partners')
    .select('slug, type')
    .eq('approved', true)
    .eq('slug', slug)
    .single()

  if (!partner || partner.type === 'expert') notFound()

  const catalogPartner = await getCatalogPartner(partner.slug)

  redirect(catalogPartner ? `/partners/catalog/${partner.slug}` : '/partners/catalog')
}
