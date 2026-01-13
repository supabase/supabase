import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { RateLimits } from 'components/interfaces/Auth/RateLimits/RateLimits'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

const RateLimitsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showRateLimits = useIsFeatureEnabled('authentication:rate_limits')

  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  if (!showRateLimits) {
    return <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
  }

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth rate limit settings" />
  }

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Rate Limits</PageHeaderTitle>
            <PageHeaderDescription>
              Safeguard against bursts of incoming traffic to prevent abuse and maximize stability
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton
              href={`${DOCS_URL}/guides/platform/going-into-prod#rate-limiting-resource-allocation--abuse-prevention`}
            />
          </PageHeaderAside>
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
          <RateLimits />
        )}
      </PageContainer>
    </>
  )
}

RateLimitsPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default RateLimitsPage
