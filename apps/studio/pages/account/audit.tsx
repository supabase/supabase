import { AuditLogs } from 'components/interfaces/Account'
import { useIsNewLayoutEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'
import { cn } from 'ui'

const Audit: NextPageWithLayout = () => {
  const newLayoutPreview = useIsNewLayoutEnabled()

  return (
    <ScaffoldContainer className={cn(newLayoutPreview ? '[&>div]:mt-8' : '')}>
      {!newLayoutPreview && (
        <ScaffoldHeader>
          <ScaffoldTitle>Account Audit Logs</ScaffoldTitle>
          <ScaffoldDescription>
            View the audit log trail of actions made from your account
          </ScaffoldDescription>
        </ScaffoldHeader>
      )}
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
