import { AuditLogs } from 'components/interfaces/Account'
import OrganizationLayout from 'app/(org)/org/layout'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'
import AccountLayout from 'app/(org)/layout'

const User: NextPageWithLayout = () => {
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

User.getLayout = (page) => (
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
)

export default User
