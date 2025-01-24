import { AuditLogs } from 'components/interfaces/Account'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'

const Audit: NextPageWithLayout = () => {
  return (
    <ScaffoldContainerLegacy className="gap-0">
      <div className="flex items-center justify-between">
        <FormHeader
          title="Account audit logs"
          description="View the audit log trail of actions made from your account"
        />
      </div>
      <AuditLogs />
    </ScaffoldContainerLegacy>
  )
}

Audit.getLayout = (page) => (
  <AppLayout>
    <AccountLayout
      title="Audit Logs"
      breadcrumbs={[
        {
          key: `supabase-settings`,
          label: 'Audit Logs',
        },
      ]}
    >
      {page}
    </AccountLayout>
  </AppLayout>
)

export default Audit
