import { ClientOnly } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

// ui-patterns/PrivacySettings imports `next/link`, whose CommonJS build
// require()s React at runtime and fails in the Vercel function. apps/kb renders
// it client-only (`client:only="react"`); this does the same, so the server
// never evaluates the module.
const PrivacySettingsButton = lazy(() =>
  import('ui-patterns/PrivacySettings').then(({ PrivacySettings, PrivacySettingsLabel }) => ({
    default: () => (
      <PrivacySettings className="text-left text-xs text-foreground-lighter hover:underline">
        <PrivacySettingsLabel />
      </PrivacySettings>
    ),
  }))
)

export function PrivacySettingsLink() {
  return (
    <ClientOnly>
      <Suspense>
        <PrivacySettingsButton />
      </Suspense>
    </ClientOnly>
  )
}
