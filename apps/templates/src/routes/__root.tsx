/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { SIGNED_IN_HINT_SCRIPT } from 'common/gotrue'
import type { ReactNode } from 'react'

import globalsCss from '@/styles/globals.css?url'
import { withBasePath } from '@/lib/base-path'

// Sets data-theme on <html> before first paint so the page doesn't flash the
// wrong theme. Same script as apps/kb/src/layouts/Layout.astro; choices come
// from components/site/HeaderMenu.tsx.
const THEME_SCRIPT = `(function () {
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)')
  var applyTheme = function () {
    try {
      var stored = localStorage.getItem('theme')
      var theme = stored === 'light' || stored === 'dark' ? stored : systemDark.matches ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', theme)
    } catch (_) {}
  }
  applyTheme()
  systemDark.addEventListener('change', applyTheme)
})()`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Supabase Templates | If you can dream it up, you can build it' },
      {
        name: 'description',
        content:
          'If you can dream it up, you can build it on Supabase. Try each template live, read the source, and start your own from any of them.',
      },
    ],
    links: [
      { rel: 'icon', href: withBasePath('/favicon.ico') },
      // Same Inter/Manrope fonts apps/docs and apps/kb use
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap',
      },
      { rel: 'stylesheet', href: globalsCss },
    ],
    scripts: [{ children: THEME_SCRIPT }, { children: SIGNED_IN_HINT_SCRIPT }],
  }),
  component: RootComponent,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-dvh flex-col">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}
