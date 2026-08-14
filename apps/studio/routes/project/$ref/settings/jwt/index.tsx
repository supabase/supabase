import { createFileRoute } from '@tanstack/react-router'

import JWTKeysLayout from '@/components/layouts/JWTKeys/JWTKeysLayout'
import JWTSigningKeysPage from '@/pages/project/[ref]/settings/jwt/index'

export const Route = createFileRoute('/project/$ref/settings/jwt/')({
  component: SettingsJwtIndexRoute,
  staticData: { settingsLayoutTitle: 'JWT Keys' },
})

// Inline the JWTKeysLayout wrap here rather than via a `settings/jwt.tsx`
// sub-shell — jwt/legacy doesn't use JWTKeysLayout, so a shared
// sub-shell would wrap legacy in the wrong layout.
function SettingsJwtIndexRoute() {
  return (
    <JWTKeysLayout>
      <JWTSigningKeysPage dehydratedState={undefined} />
    </JWTKeysLayout>
  )
}
