import { PermissionAction } from '@supabase/shared-types/out/constants'

import {
  SmtpForm,
  BasicAuthSettingsForm,
  AdvancedAuthSettingsForm,
} from 'components/interfaces/Auth'
import { SettingsLayout } from 'components/layouts'
import { FormHeader } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks'
import type { NextPageWithLayout } from 'types'

const AuthSettings: NextPageWithLayout = () => {
  const isPermissionsLoaded = usePermissionsLoaded()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-8 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32">
      <FormHeader
        className="!mb-0"
        title="Auth Settings"
        description="Configure security and user session settings."
      />
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
    </div>
  )
}

AuthSettings.getLayout = (page) => <SettingsLayout>{page}</SettingsLayout>
export default AuthSettings
