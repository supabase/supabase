import { PermissionAction } from '@supabase/shared-types/out/constants'

import {
  SmtpForm,
  BasicAuthSettingsForm,
  AdvancedAuthSettingsForm,
} from 'components/interfaces/Auth'
import { SettingsLayout } from 'components/layouts'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks'
import type { NextPageWithLayout } from 'types'

const AuthSettings: NextPageWithLayout = () => {
  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>Auth settings</ScaffoldTitle>
          <ScaffoldDescription>Configure security and user session settings</ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        {!isPermissionsLoaded ? (
          <GenericSkeletonLoader />
        ) : !canReadAuthSettings ? (
          <NoPermission isFullPage resourceText="access your project's authentication settings" />
        ) : (
          <>
            <BasicAuthSettingsForm />
            <SmtpForm />
            <AdvancedAuthSettingsForm />
          </>
        )}
      </ScaffoldContainer>
    </>
  )
}

AuthSettings.getLayout = (page) => <SettingsLayout>{page}</SettingsLayout>
export default AuthSettings
