import { AuditLogs } from 'components/interfaces/Account'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const Audit: NextPageWithLayout = () => {
  return (
    <ScaffoldContainerLegacy className="gap-0">
      <AuditLogs />
    </ScaffoldContainerLegacy>
  )
}

Audit.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Account">
      <OrganizationLayout>
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
      </OrganizationLayout>
    </DefaultLayout>
  </AppLayout>
)

export default Audit
