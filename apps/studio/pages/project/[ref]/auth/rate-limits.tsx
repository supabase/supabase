import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { RateLimits } from 'components/interfaces/Auth/RateLimits/RateLimits'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

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
    <ScaffoldContainer>
      {!isPermissionsLoaded ? (
        <ScaffoldSection isFullWidth>
          <GenericSkeletonLoader />
        </ScaffoldSection>
      ) : (
        <RateLimits />
      )}
    </ScaffoldContainer>
  )
}

RateLimitsPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Rate Limits"
        subtitle="Safeguard against bursts of incoming traffic to prevent abuse and maximize stability"
        primaryActions={
          <DocsButton
            href={`${DOCS_URL}/guides/platform/going-into-prod#rate-limiting-resource-allocation--abuse-prevention`}
          />
        }
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default RateLimitsPage
