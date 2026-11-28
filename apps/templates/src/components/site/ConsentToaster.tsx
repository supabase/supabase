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

  // Follow data-theme, which the no-flash script and the theme switch set.
  useEffect(() => {
    const root = document.documentElement
    const sync = () => setTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
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
