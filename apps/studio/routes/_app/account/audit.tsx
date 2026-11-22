import { createFileRoute } from '@tanstack/react-router'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { AuditLogs } from '@/components/interfaces/Account/AuditLogs'

export const Route = createFileRoute('/_app/account/audit')({
  component: AccountAuditPage,
  staticData: {
    defaultLayoutHeaderTitle: 'Account',
    accountLayoutTitle: 'Audit Logs',
  },
})

function AccountAuditPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader size="full">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Audit Logs</PageHeaderTitle>
            <PageHeaderDescription>
              Detailed history of your account activities and security events.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <div className="flex-1 min-h-0">
        <AuditLogs />
      </div>
    </div>
  )
}
