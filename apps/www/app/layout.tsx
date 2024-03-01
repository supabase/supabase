import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../styles/index.css'

import { Metadata } from 'next'
import Favicons from '~/components/Favicons'
import { APP_NAME, DEFAULT_META_DESCRIPTION } from '~/lib/constants'
import Providers from './Providers'

export const metadata: Metadata = {
  title: `${APP_NAME} | The Open Source Firebase Alternative`,
  description: DEFAULT_META_DESCRIPTION,
  openGraph: {
    type: 'website',
    url: 'https://supabase.com/',
    siteName: 'Supabase',
    images: [
      {
        url: `https://supabase.com/images/og/og-image-v2.jpg`,
        width: 800,
        height: 600,
        alt: 'Supabase Og Image',
      },
    ],
  },
  twitter: {
    creatorId: '@supabase',
    site: '@supabase',
    card: 'summary_large_image',
  },
}

export default function App({ children }: any) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Favicons />
      </head>
      <Providers>
        <body>{children}</body>
      </Providers>
    </html>
  )
}
