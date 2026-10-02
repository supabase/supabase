import { createFileRoute } from '@tanstack/react-router'

import OAuthServerPage from '@/pages/project/[ref]/auth/oauth-server'

export const Route = createFileRoute('/project/$ref/auth/oauth-server')({
  component: AuthOAuthServerRoute,
  staticData: {
    authLayoutTitle: 'OAuth Server',
  },
})

function AuthOAuthServerRoute() {
  return <OAuthServerPage dehydratedState={undefined} />
}
