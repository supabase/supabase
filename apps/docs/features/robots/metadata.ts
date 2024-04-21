import { Viewport, type Metadata } from 'next'

import { BASE_PATH } from '~/lib/constants'

const metadata: Metadata = {
  applicationName: 'Supabase Docs',
  metadataBase: new URL('https://acme.com'),
  manifest: `${BASE_PATH}/favicon/site.webmanifest`,
}

const alternates: Metadata = {
  alternates: {
    types: {
      'application/rss+xml': `${BASE_PATH}/feed.xml`,
    },
  },
}

const viewport: Viewport = {
  themeColor: '#1E1E1E',
}

export { alternates, metadata, viewport }
