import { AuditLogs } from 'components/interfaces/Account'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
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
    <DefaultLayout headerTitle="Account">
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
    </DefaultLayout>
  </AppLayout>
)

export default Audit
