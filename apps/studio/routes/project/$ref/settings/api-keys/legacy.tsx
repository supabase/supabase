import { createFileRoute } from '@tanstack/react-router'

import ApiKeysLegacyPage from '@/pages/project/[ref]/settings/api-keys/legacy'

export const Route = createFileRoute('/project/$ref/settings/api-keys/legacy')({
  component: SettingsApiKeysLegacyRoute,
  staticData: { settingsLayoutTitle: 'API Keys (Legacy)' },
})

function SettingsApiKeysLegacyRoute() {
  return <ApiKeysLegacyPage dehydratedState={undefined} />
}
