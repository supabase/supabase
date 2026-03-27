import type { Metadata } from 'next'

import { AppRouterProviders } from '@/app/v2/AppRouterProviders'
import { genFaviconData } from 'common/MetaFavicons/app-router'
import 'react-data-grid/lib/styles.css'
import 'styles/code.scss'
import 'styles/contextMenu.scss'
import 'styles/editor.scss'
import 'styles/focus.scss'
import 'styles/graphiql-base.scss'
import 'styles/grid.scss'
import 'styles/main.scss'
import 'styles/markdown-preview.scss'
import 'styles/monaco.scss'
import 'styles/react-data-grid-logs.scss'
import 'styles/reactflow.scss'
import 'styles/storage.scss'
import 'styles/stripe.scss'
import 'styles/toast.scss'
import 'styles/typography.scss'
import 'styles/ui.scss'
import 'ui-patterns/ShimmeringLoader/index.css'
import 'ui/build/css/themes/dark.css'
import 'ui/build/css/themes/light.css'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const metadata: Metadata = {
  applicationName: 'Supabase Studio',
  title: 'Supabase',
  icons: genFaviconData(BASE_PATH),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppRouterProviders>{children}</AppRouterProviders>
      </body>
    </html>
  )
}
