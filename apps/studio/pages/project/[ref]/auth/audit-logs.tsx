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
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const AuditLogsPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { isLoading: isLoadingConfig } = useAuthConfigQuery({ projectRef })
  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

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

const secondaryActions = [<DocsButton key="docs" href={`${DOCS_URL}/guides/auth/audit-logs`} />]

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
