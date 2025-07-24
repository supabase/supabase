import { PermissionAction } from '@supabase/shared-types/out/constants'

import { AuditLogsForm } from 'components/interfaces/Auth'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const AuditLogsPage: NextPageWithLayout = () => {
  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's audit logs settings" />
  }

  return (
    <ScaffoldContainer>
      {!isPermissionsLoaded ? (
        <div className="mt-12">
          <GenericSkeletonLoader />
        </div>
      ) : (
        <AuditLogsForm />
      )}
    </ScaffoldContainer>
  )
}

AuditLogsPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout title="Audit Logs" subtitle="Track and monitor auth events in your project">
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default AuditLogsPage
