import { createFileRoute } from '@tanstack/react-router'

import JWTKeysLegacyPage from '@/pages/project/[ref]/settings/jwt/legacy'

export const Route = createFileRoute('/project/$ref/settings/jwt/legacy')({
  component: SettingsJwtLegacyRoute,
  staticData: { settingsLayoutTitle: 'JWT Keys (Legacy)' },
})

function SettingsJwtLegacyRoute() {
  return <JWTKeysLegacyPage dehydratedState={undefined} />
}
