import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { ProtectionAuthSettingsForm } from 'components/interfaces/Auth/ProtectionAuthSettingsForm/ProtectionAuthSettingsForm'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import NoPermission from 'components/ui/NoPermission'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

const ProtectionPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showAttackProtection = useIsFeatureEnabled('authentication:attack_protection')

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  if (!showAttackProtection) {
    return <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
  }

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth provider settings" />
  }

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Attack Protection</PageHeaderTitle>
            <PageHeaderDescription>
              Configure security settings to protect your project from attacks
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        {!isPermissionsLoaded ? (
          <PageSection>
            <PageSectionContent>
              <GenericSkeletonLoader />
            </PageSectionContent>
          </PageSection>
        ) : (
          <ProtectionAuthSettingsForm />
        )}
      </PageContainer>
    </>
  )
}

ProtectionPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default ProtectionPage
