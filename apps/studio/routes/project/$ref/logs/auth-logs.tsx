import { createFileRoute } from '@tanstack/react-router'

import AuthLogsPage from '@/pages/project/[ref]/logs/auth-logs'

export const Route = createFileRoute('/project/$ref/logs/auth-logs')({
  component: AuthLogsRoute,
  staticData: { logsLayoutTitle: 'Auth Logs' },
})

function AuthLogsRoute() {
  return <AuthLogsPage dehydratedState={undefined} />
}
