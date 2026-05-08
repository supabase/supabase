import type { Metadata } from 'next'

import PartnersContent from './PartnersContent'
import pageData from '@/data/partners'

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

export default function PartnersPage() {
  return <PartnersContent />
}
