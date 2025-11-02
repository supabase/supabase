import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { AdvancedAuthSettingsForm } from 'components/interfaces/Auth/AdvancedAuthSettingsForm'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const AdvancedPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showAdvanced = useIsFeatureEnabled('authentication:advanced')

  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (!showAdvanced) {
    return <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
  }

  return (
    <PageLayout title="Advanced" subtitle="Configure advanced authentication server settings">
      {isPermissionsLoaded && !canReadAuthSettings ? (
        <NoPermission isFullPage resourceText="access your project's authentication settings" />
      ) : (
        <ScaffoldContainer>
          {!isPermissionsLoaded ? (
            <ScaffoldSection isFullWidth>
              <GenericSkeletonLoader />
            </ScaffoldSection>
          ) : (
            <AdvancedAuthSettingsForm />
          )}
        </ScaffoldContainer>
      )}
    </PageLayout>
  )
}

AdvancedPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default AdvancedPage
