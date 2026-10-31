import { createFileRoute } from '@tanstack/react-router'

import AuditPage from '@/pages/account/audit'

export const Route = createFileRoute('/_app/account/audit')({
  component: AccountAuditPage,
  staticData: {
    defaultLayoutHeaderTitle: 'Account',
    accountLayoutTitle: 'Audit Logs',
  },
})

function AccountAuditPage() {
  return <AuditPage dehydratedState={undefined} />
}
