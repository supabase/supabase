import { type Metadata } from 'next'

import { BASE_PATH } from '~/lib/constants'

const metadata: Metadata = {
    applicationName: 'Supabase Docs',
    manifest: `${BASE_PATH}/favicon/site.webmanifest`,
    themeColor: '#1E1E1E'
}

const alternates: Metadata = {
    alternates: {
        types: {
            'application/rss+xml': `${BASE_PATH}/feed.xml`,
        },
    }
}

export { alternates, metadata }