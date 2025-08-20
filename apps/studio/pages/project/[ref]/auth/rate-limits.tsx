import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import RateLimits from 'components/interfaces/Auth/RateLimits/RateLimits'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const RateLimitsPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const showRateLimits = useIsFeatureEnabled('authentication:rate_limits')

  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (!showRateLimits) {
    return <UnknownInterface urlBack={`/project/${ref}/auth/users`} />
  }

  return (
    <PageLayout
      title="Rate Limits"
      subtitle="Safeguard against bursts of incoming traffic to prevent abuse and maximize stability"
      primaryActions={
        <DocsButton href="https://supabase.com/docs/guides/platform/going-into-prod#rate-limiting-resource-allocation--abuse-prevention" />
      }
    >
      {isPermissionsLoaded && !canReadAuthSettings ? (
        <NoPermission isFullPage resourceText="access your project's auth rate limit settings" />
      ) : (
        <ScaffoldContainer>
          {!isPermissionsLoaded ? (
            <ScaffoldSection isFullWidth>
              <GenericSkeletonLoader />
            </ScaffoldSection>
          ) : (
            <RateLimits />
          )}
        </ScaffoldContainer>
      )}
    </PageLayout>
  )
}

RateLimitsPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>{page}</AuthLayout>
  </DefaultLayout>
)

export default RateLimitsPage
