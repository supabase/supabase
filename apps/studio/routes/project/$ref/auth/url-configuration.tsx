import { createFileRoute } from '@tanstack/react-router'

import URLConfiguration from '@/pages/project/[ref]/auth/url-configuration'

export const Route = createFileRoute('/project/$ref/auth/url-configuration')({
  component: AuthUrlConfigurationRoute,
  staticData: {
    authLayoutTitle: 'URL Configuration',
  },
})

function AuthUrlConfigurationRoute() {
  return <URLConfiguration dehydratedState={undefined} />
}
