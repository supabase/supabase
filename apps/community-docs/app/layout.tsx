import '../styles/main.css'

import type { Metadata, Viewport } from 'next'

import { CommunityDocsSearchProvider } from '@/components/CommunityDocsSearchProvider.client'
import { Providers } from '@/components/Providers.client'
import { TopNav } from '@/components/TopNav'
import { createClient } from '@/lib/supabase/server'

const metadata: Metadata = {
  applicationName: 'Supabase Community Docs',
  title: {
    default: 'Supabase Community Docs',
    template: '%s | Supabase Community Docs',
  },
  description: 'Community-built integrations, examples, and getting-started guides.',
  metadataBase: new URL('https://supabase.com'),
  icons: {
    icon: {
      url: '/community-docs/favicon.ico?v=docs',
      type: 'image/x-icon',
    },
    shortcut: '/community-docs/favicon.ico?v=docs',
  },
  robots: {
    index: false,
    follow: false,
  },
}

const viewport: Viewport = {
  themeColor: '#1E1E1E',
}

async function getOptionalUserEmail() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return undefined
  }

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getClaims()
    const email = data?.claims?.email
    return typeof email === 'string' ? email : undefined
  } catch {
    return undefined
  }
}

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const userEmail = await getOptionalUserEmail()

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <CommunityDocsSearchProvider>
            <TopNav userEmail={userEmail} />
            {children}
          </CommunityDocsSearchProvider>
        </Providers>
      </body>
    </html>
  )
}

export { metadata, viewport }
export default RootLayout
