import type { Metadata } from 'next'

import { FrameworksSection } from './_components/FrameworksSection'
import { HomeContent } from './_components/HomeContent'
import { DEFAULT_META_DESCRIPTION } from '@/lib/constants'
import {
  organizationSchema,
  serializeJsonLd,
  softwareApplicationSchema,
  websiteSchema,
} from '@/lib/json-ld'
import { mdAlternates } from '@/lib/md-alternates'

export const metadata: Metadata = {
  alternates: {
    ...mdAlternates('index'),
    canonical: 'https://supabase.com',
  },
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            softwareApplicationSchema({
              name: 'Supabase',
              description: DEFAULT_META_DESCRIPTION,
              url: 'https://supabase.com',
              image: 'https://supabase.com/images/og/supabase-og.png',
            })
          ),
        }}
      />
      <HomeContent frameworksSlot={<FrameworksSection />} />
    </>
  )
}
