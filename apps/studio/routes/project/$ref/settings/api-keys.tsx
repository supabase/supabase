import { createFileRoute, Outlet } from '@tanstack/react-router'

import ApiKeysLayout from '@/components/layouts/APIKeys/APIKeysLayout'

export const Route = createFileRoute('/project/$ref/settings/api-keys')({
  component: ApiKeysShell,
})

// The parent settings.tsx shell handles SettingsLayout (title via the
// leaf's `settingsLayoutTitle` staticData); this sub-shell adds the
// ApiKeysLayout tab strip both api-keys leaves share.
function ApiKeysShell() {
  return (
    <ApiKeysLayout>
      <Outlet />
    </ApiKeysLayout>
  )
}
