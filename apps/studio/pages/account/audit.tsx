import { AuditLogs } from 'components/interfaces/Account'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const User: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldHeader>
        <ScaffoldTitle>Account Audit Logs</ScaffoldTitle>
        <ScaffoldDescription>
          View the audit log trail of actions made from your account
        </ScaffoldDescription>
      </ScaffoldHeader>
      <AuditLogs />
    </ScaffoldContainer>
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
