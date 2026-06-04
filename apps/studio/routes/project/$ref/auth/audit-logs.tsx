import { createFileRoute } from '@tanstack/react-router'

import AuditLogsPage from '@/pages/project/[ref]/auth/audit-logs'

export const Route = createFileRoute('/project/$ref/auth/audit-logs')({
  component: AuthAuditLogsRoute,
  staticData: {
    authLayoutTitle: 'Audit Logs',
  },
})

function AuthAuditLogsRoute() {
  return <AuditLogsPage dehydratedState={undefined} />
}
