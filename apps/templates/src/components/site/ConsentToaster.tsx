import { ClientOnly } from '@tanstack/react-router'
import { lazy, Suspense, useEffect, useState } from 'react'
import { SonnerToaster } from 'ui'

// Mirrors apps/kb/src/components/ConsentIsland.tsx, which kb renders
// client-only. ui-patterns/consent pulls in `next/link` (via PrivacySettings),
// whose CommonJS build fails in the Vercel function, so it loads lazily on the
// client only.
const ConsentToast = lazy(() =>
  import('ui-patterns/consent').then(({ useConsentToast }) => ({
    default: function ConsentToastMount() {
      useConsentToast()
      return null
    },
  }))
)

export function ConsentToaster() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // data-theme is set on the client by the no-flash script
  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
  }, [])

  return (
    <>
      <ClientOnly>
        <Suspense>
          <ConsentToast />
        </Suspense>
      </ClientOnly>
      <SonnerToaster theme={theme} />
    </>
  )
}
