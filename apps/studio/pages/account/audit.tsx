import { AuditLogs } from 'components/interfaces/Account'
import { useNewLayout } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import AccountLayout from 'components/layouts/AccountLayout/AccountLayout'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import {
  ScaffoldContainer,
  ScaffoldContainerLegacy,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'

const Audit: NextPageWithLayout = () => {
  const newLayoutPreview = useNewLayout()

  if (newLayoutPreview) {
    return (
      <ScaffoldContainerLegacy className="gap-0">
        <AuditLogs />
      </ScaffoldContainerLegacy>
    )
  }

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
