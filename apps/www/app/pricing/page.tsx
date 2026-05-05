import type { Metadata } from 'next'
import { plans } from 'shared-data/plans'

import PricingContent from './PricingContent'
import pricingFaq from '@/data/PricingFAQ.json'
import { faqPageSchema, pricingProductSchema, serializeJsonLd } from '@/lib/json-ld'

const PRICING_DESCRIPTION =
  'Explore Supabase fees and pricing information. Find our competitive pricing Plans, with no hidden pricing. We have a generous Free Plan for those getting started, and Pay As You Go for those scaling up.'

export const metadata: Metadata = {
  title: 'Pricing & Fees | Supabase',
  description: PRICING_DESCRIPTION,
  alternates: {
    types: {
      'text/markdown': '/pricing.md',
    },
  },
  openGraph: {
    title: 'Pricing & Fees | Supabase',
    description: PRICING_DESCRIPTION,
    url: 'https://supabase.com/pricing',
    images: [
      {
        url: 'https://supabase.com/images/og/supabase-og.png',
      },
    ],
  },
}

const FAQ_JSON_LD = serializeJsonLd(faqPageSchema(pricingFaq))
const PRODUCT_JSON_LD = serializeJsonLd(
  pricingProductSchema({
    plans,
    url: 'https://supabase.com/pricing',
    description: PRICING_DESCRIPTION,
    image: 'https://supabase.com/images/og/supabase-og.png',
  })
)

export default function PricingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: PRODUCT_JSON_LD }} />
      <PricingContent />
    </>
  )
}
