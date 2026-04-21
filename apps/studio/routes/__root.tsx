/// <reference types="vite/client" />

import 'react-data-grid/lib/styles.css'
import '@/styles/code.css'
import '@/styles/editor.css'
import '@/styles/focus.css'
import '@/styles/graphiql-base.css'
import '@/styles/grid.css'
import '@/styles/main.css'
import '@/styles/markdown-preview.css'
import '@/styles/monaco.css'
import '@/styles/react-data-grid-logs.css'
import '@/styles/reactflow.css'
import '@/styles/storage.css'
import '@/styles/stripe.css'
import '@/styles/toast.css'
import '@/styles/typography.css'
import '@/styles/ui.css'
import 'ui-patterns/ShimmeringLoader/index.css'
import 'ui/build/css/themes/dark.css'
import 'ui/build/css/themes/light.css'

import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import type { ReactNode } from 'react'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Supabase',
      },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  return <Outlet />
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'TanStack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
