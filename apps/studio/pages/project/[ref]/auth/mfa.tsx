import { useParams } from 'common'
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

import { MfaAuthSettingsForm } from '@/components/interfaces/Auth/MfaAuthSettingsForm/MfaAuthSettingsForm'
import AuthLayout from '@/components/layouts/AuthLayout/AuthLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { NoPermission } from '@/components/ui/NoPermission'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from '@/types'
import { useAsyncCheckPermissionsV2, FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'

const MfaPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showMFA = useIsFeatureEnabled('authentication:multi_factor')

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_READ
  )

  if (!showMFA) {
    return <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
  }

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's authentication settings" />
  }

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Multi-Factor Authentication (MFA)</PageHeaderTitle>
            <PageHeaderDescription>
              Requires users to provide additional verification factors to authenticate
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
          <MfaAuthSettingsForm />
        )}
      </PageContainer>
    </>
  )
}

MfaPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout title="Multi-Factor">{page}</AuthLayout>
  </DefaultLayout>
)

export default MfaPage
