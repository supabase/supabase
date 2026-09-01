import type { Metadata } from 'next'

import { FrameworksSection } from './_components/FrameworksSection'
import { HomeContent } from './_components/HomeContent'
import { DEFAULT_META_DESCRIPTION } from '@/lib/constants'
import {
  organizationSchema,
  serializeJsonLd,
  serviceSchema,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            serviceSchema({
              name: 'Supabase',
              description: DEFAULT_META_DESCRIPTION,
              url: 'https://supabase.com',
              serviceType: 'Backend as a Service',
              offerings: [
                { name: 'Database', url: 'https://supabase.com/database' },
                { name: 'Authentication', url: 'https://supabase.com/auth' },
                { name: 'Storage', url: 'https://supabase.com/storage' },
                { name: 'Edge Functions', url: 'https://supabase.com/edge-functions' },
                { name: 'Realtime', url: 'https://supabase.com/realtime' },
                { name: 'Vector', url: 'https://supabase.com/modules/vector' },
              ],
            })
          ),
        }}
      />
      <HomeContent frameworksSlot={<FrameworksSection />} />
    </>
  )
}
