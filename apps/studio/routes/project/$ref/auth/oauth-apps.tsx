import { createFileRoute } from '@tanstack/react-router'

import OAuthApps from '@/pages/project/[ref]/auth/oauth-apps'

export const Route = createFileRoute('/project/$ref/auth/oauth-apps')({
  component: AuthOAuthAppsRoute,
  staticData: {
    authLayoutTitle: 'OAuth Apps',
  },
})

function AuthOAuthAppsRoute() {
  return <OAuthApps dehydratedState={undefined} />
}
