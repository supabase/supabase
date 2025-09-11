import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { AuditLogsForm } from 'components/interfaces/Auth/AuditLogsForm'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const AuditLogsPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const isPermissionsLoaded = usePermissionsLoaded()
  const { isLoading: isLoadingConfig } = useAuthConfigQuery({ projectRef })
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's audit logs settings" />
  }

  return (
    <ScaffoldContainer>
      {!isPermissionsLoaded || isLoadingConfig ? (
        <div className="mt-12">
          <GenericSkeletonLoader />
        </div>
      ) : (
        <AuditLogsForm />
      )}
    </ScaffoldContainer>
  )
}

const secondaryActions = [
  <DocsButton key="docs" href="https://supabase.com/docs/guides/auth/audit-logs" />,
]

AuditLogsPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Audit Logs"
        subtitle="Track and monitor auth events in your project"
        secondaryActions={secondaryActions}
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default AuditLogsPage
