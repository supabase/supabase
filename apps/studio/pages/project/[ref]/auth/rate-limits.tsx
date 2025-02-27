import { PermissionAction } from '@supabase/shared-types/out/constants'

import RateLimits from 'components/interfaces/Auth/RateLimits/RateLimits'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import {
  ScaffoldHeader,
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'

const PageLayout: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth rate limit settings" />
  } else {
    return (
      <div>
        <ScaffoldHeader className="pb-0">
          <ScaffoldContainer id="auth-page-top" className="flex items-center justify-between">
            <div>
              <ScaffoldTitle>Rate Limits</ScaffoldTitle>
              <ScaffoldDescription>
                Safeguard against bursts of incoming traffic to prevent abuse and maximize stability
              </ScaffoldDescription>
            </div>
            <DocsButton href="https://supabase.com/docs/guides/platform/going-into-prod#rate-limiting-resource-allocation--abuse-prevention" />
          </ScaffoldContainer>
        </ScaffoldHeader>

        <ScaffoldContainer className="my-8 space-y-8">
          <RateLimits />
        </ScaffoldContainer>
      </div>
    )
  }
}

PageLayout.getLayout = (page) => {
  return (
    <DefaultLayout>
      <AuthLayout>{page}</AuthLayout>
    </DefaultLayout>
  )
}

export default PageLayout
