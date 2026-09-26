import type { Metadata } from 'next'

import PartnersContent from './PartnersContent'
import pageData from '@/data/partners'
import supabase from '@/lib/supabaseMisc'

export const revalidate = 1800

const FEATURED_PARTNER_LIMIT = 30

type FeaturedPartner = { slug: string; title: string; logo: string }

export const metadata: Metadata = {
  title: pageData.metaTitle,
  description: pageData.metaDescription,
  openGraph: {
    title: pageData.metaTitle,
    description: pageData.metaDescription,
    url: 'https://supabase.com/partners',
    images: [{ url: 'https://supabase.com/images/og/integrations.png' }],
  },
}

export default async function PartnersPage() {
  const { data: partners } = await supabase
    .from('partners')
    .select('slug,title,logo')
    .eq('approved', true)
    .eq('type', 'technology')
    .order('title')

  const all = (partners ?? []) as FeaturedPartner[]
  const leadSlugs = pageData.featuredPartners.leadSlugs
  const lead = leadSlugs
    .map((slug) => all.find((p) => p.slug === slug))
    .filter((p): p is FeaturedPartner => Boolean(p))
  const rest = all.filter((p) => !leadSlugs.includes(p.slug))
  const featuredPartners = [...lead, ...rest].slice(0, FEATURED_PARTNER_LIMIT)

  return <PartnersContent featuredPartners={featuredPartners} />
}
