import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ReactNode } from 'react'

import { useParams } from 'common'
import RateLimits from 'components/interfaces/Auth/RateLimits/RateLimits'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

interface RateLimitsLayoutProps {
  children: ReactNode
}

export const RateLimitsLayout = ({ children }: RateLimitsLayoutProps) => {
  const { ref } = useParams()

  return (
    <DefaultLayout>
      <AuthLayout>
        <PageLayout
          title="Rate Limits"
          subtitle="Safeguard against bursts of incoming traffic to prevent abuse and maximize stability"
          primaryActions={
            <DocsButton href="https://supabase.com/docs/guides/platform/going-into-prod#rate-limiting-resource-allocation--abuse-prevention" />
          }
        >
          {children}
        </PageLayout>
      </AuthLayout>
    </DefaultLayout>
  )
}

const RateLimitsPage: NextPageWithLayout = () => {
  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth rate limit settings" />
  }

  return (
    <ScaffoldContainer>
      {!isPermissionsLoaded ? <GenericSkeletonLoader /> : <RateLimits />}
    </ScaffoldContainer>
  )
}

RateLimitsPage.getLayout = (page) => <RateLimitsLayout>{page}</RateLimitsLayout>

export default RateLimitsPage
