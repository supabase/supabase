import { Metadata } from 'next'
import WrappedClient from './WrappedClient'

export const metadata: Metadata = {
  title: 'Supabase Wrapped 2025',
  description:
    'In 2025, developers around the world shipped faster, scaled further, and built things we never imagined. Here is what you accomplished on Supabase.',
  openGraph: {
    title: 'Supabase Wrapped 2025',
    description:
      'In 2025, developers around the world shipped faster, scaled further, and built things we never imagined. Here is what you accomplished on Supabase.',
    url: 'https://supabase.com/wrapped',
    siteName: 'Supabase',
    images: [
      {
        url: '/images/wrapped/wrapped-og.png',
        width: 1200,
        height: 630,
        alt: 'Supabase Wrapped 2025',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Supabase Wrapped 2025',
    description:
      'In 2025, developers around the world shipped faster, scaled further, and built things we never imagined. Here is what you accomplished on Supabase.',
    images: ['/images/wrapped/wrapped-og.png'],
  },
}

export default function SupabaseWrappedPage() {
  return <WrappedClient />
}
