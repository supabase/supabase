import { PermissionAction } from '@supabase/shared-types/out/constants'

import LegacyAPIKeys from 'components/interfaces/APIKeys/LegacyAPIKeys'
import PublishableAPIKeys from 'components/interfaces/APIKeys/PublishableAPIKeys'
import SecretAPIKeys from 'components/interfaces/APIKeys/SecretAPIKeys'
import APIKeysLayout from 'components/layouts/project/[ref]/settings/APIKeysLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import { Separator } from 'ui'

const AuthSettings: NextPageWithLayout = () => {
  const isPermissionsLoaded = usePermissionsLoaded()
  // TODO: check if these permissions cover third party auth as well
  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'api_keys')

  return (
    <>
      {!isPermissionsLoaded ? (
        <GenericSkeletonLoader />
      ) : !canReadAPIKeys ? (
        <NoPermission isFullPage resourceText="access your project's API keys" />
      ) : (
        <>
          <LegacyAPIKeys />
        </>
      )}
    </>
  )
}

AuthSettings.getLayout = (page) => (
  <SettingsLayout>
    <APIKeysLayout>{page}</APIKeysLayout>
  </SettingsLayout>
)
export default AuthSettings
