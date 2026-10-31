import { createFileRoute } from '@tanstack/react-router'

import ApiSettings from '@/pages/project/[ref]/settings/api'

export const Route = createFileRoute('/project/$ref/settings/api')({
  component: SettingsApiRoute,
  // Page is a useEffect redirect that returns null; SettingsLayout
  // (the sidebar shell) shouldn't render around it.
  staticData: { skipSettingsLayout: true },
})

function SettingsApiRoute() {
  return <ApiSettings dehydratedState={undefined} />
}
