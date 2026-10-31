import { createFileRoute } from '@tanstack/react-router'

import ApiKeysNewPage from '@/pages/project/[ref]/settings/api-keys/index'

export const Route = createFileRoute('/project/$ref/settings/api-keys/')({
  component: SettingsApiKeysIndexRoute,
  staticData: { settingsLayoutTitle: 'API Keys' },
})

function SettingsApiKeysIndexRoute() {
  return <ApiKeysNewPage dehydratedState={undefined} />
}
