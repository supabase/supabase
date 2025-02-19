import { PermissionAction } from '@supabase/shared-types/out/constants'

import { SessionsAuthSettingsForm, SmtpForm, ThirdPartyAuthForm } from 'components/interfaces/Auth'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldHeader, ScaffoldTitle } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const isPermissionsLoaded = usePermissionsLoaded()
  // TODO: check if these permissions cover third party auth as well
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Sessions</ScaffoldTitle>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        {!isPermissionsLoaded ? (
          <GenericSkeletonLoader />
        ) : !canReadAuthSettings ? (
          <NoPermission isFullPage resourceText="access your project's authentication settings" />
        ) : (
          <SessionsAuthSettingsForm />
        )}
      </ScaffoldContainer>
    </>
  )
}

PageLayout.getLayout = (page) => {
  return (
    <DefaultLayout>
      <AuthLayout>{page}</AuthLayout>
    </DefaultLayout>
  )
}
export default PageLayout
