import { AuditLogs } from 'components/interfaces/Account'
import { AccountLayout } from 'components/layouts'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms'
import { NextPageWithLayout } from 'types'

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
    title="Preferences"
    breadcrumbs={[
      {
        key: `supabase-settings`,
        label: 'Preferences',
      },
    ]}
  >
    {page}
  </AccountLayout>
)

export default User
