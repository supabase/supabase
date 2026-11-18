import { createFileRoute, Navigate } from '@tanstack/react-router'

import { IS_PLATFORM } from '@/lib/constants'

export const Route = createFileRoute('/project/$ref/settings/api')({
  component: ApiSettings,
  // Page is a redirect that renders nothing; SettingsLayout
  // (the sidebar shell) shouldn't render around it.
  staticData: { skipSettingsLayout: true },
})

function ApiSettings() {
  const { ref } = Route.useParams()

  if (IS_PLATFORM) {
    return (
      <Navigate
        to="/project/$ref/integrations/$id/$pageId"
        params={{ ref, id: 'data_api', pageId: 'overview' }}
        replace
      />
    )
  }

  return <Navigate to="/project/$ref/settings/general" params={{ ref }} replace />
}
