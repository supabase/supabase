import type { Metadata } from 'next'

import { AgenticContent } from './_components/AgenticContent'
import { canonicalAlternates } from '@/lib/canonical'

const title = 'Idea to Production, and Back Again | Supabase'
const description =
  'Supabase gives your agent everything it needs to build, deploy, and operate your software.'

export const metadata: Metadata = {
  alternates: canonicalAlternates('/agentic'),
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://supabase.com/agentic',
    siteName: 'Supabase',
    type: 'website',
    images: [
      {
        url: 'https://supabase.com/images/og/supabase-og.png',
        width: 800,
        height: 600,
        alt: 'Supabase Og Image',
      },
    ],
  },
}

export default function AgenticPage() {
  return <AgenticContent />
}
