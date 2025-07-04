import { AuditLogs } from 'components/interfaces/Account'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'
import { cn } from 'ui'

const Audit: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer className={cn('[&>div]:mt-8')}>
      <AuditLogs />
    </ScaffoldContainer>
  )
}

Audit.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <OrganizationLayout>
        <AccountLayout title="Audit Logs">{page}</AccountLayout>
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default Audit
