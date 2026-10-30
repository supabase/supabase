import { createFileRoute, Outlet } from '@tanstack/react-router'

import ApiKeysLayout from '@/components/layouts/APIKeys/APIKeysLayout'

export const Route = createFileRoute('/project/$ref/settings/api-keys')({
  component: ApiKeysShell,
})

// Sub-shell mirroring the existing pages-router pattern: both
// api-keys/index and api-keys/legacy wrap their content in
// <SettingsLayout title=...><ApiKeysLayout>{page}</ApiKeysLayout></SettingsLayout>.
// The parent settings.tsx shell handles SettingsLayout (title via the
// leaf's `settingsLayoutTitle` staticData); this sub-shell adds the
// ApiKeysLayout tab strip both leaves share.
function ApiKeysShell() {
  return (
    <ApiKeysLayout>
      <Outlet />
    </ApiKeysLayout>
  )
}
