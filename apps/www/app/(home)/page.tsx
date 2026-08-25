import type { Metadata } from 'next'

import { FrameworksSection } from './_components/FrameworksSection'
import { HomeContent } from './_components/HomeContent'
import { organizationSchema, serializeJsonLd, websiteSchema } from '@/lib/json-ld'
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
      <HomeContent frameworksSlot={<FrameworksSection />} />
    </>
  )
}
