import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { AuditLogs } from '@/components/interfaces/Account/AuditLogs/AuditLogs'
import AccountLayout from '@/components/layouts/AccountLayout/AccountLayout'
import { AppLayout } from '@/components/layouts/AppLayout/AppLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const Audit: NextPageWithLayout = () => {
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

Audit.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <AccountLayout title="Audit Logs">{page}</AccountLayout>
    </DefaultLayout>
  </AppLayout>
)

export default Audit
