import { PermissionAction } from '@supabase/shared-types/out/constants'

import LegacyAPIKeys from 'components/interfaces/APIKeys/LegacyAPIKeys'
import PublishableAPIKeys from 'components/interfaces/APIKeys/PublishableAPIKeys'
import SecretAPIKeys from 'components/interfaces/APIKeys/SecretAPIKeys'
import ApiKeysLayout from 'components/layouts/project/[ref]/settings/APIKeysLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Separator } from 'ui'

const AuthSettings: NextPageWithLayout = () => {
  const [apiKeysView] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.API_KEYS_VIEW, undefined)

  // const isPermissionsLoaded = usePermissionsLoaded()
  // TODO: check if these permissions cover third party auth as well
  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'api_keys')

  return (
    <>
      {apiKeysView === 'new-keys' ? (
        <>
          <PublishableAPIKeys />
          <Separator />
          <SecretAPIKeys />
        </>
      ) : (
        <LegacyAPIKeys />
      )}
    </>
  )
}

AuthSettings.getLayout = (page) => (
  <SettingsLayout>
    <ApiKeysLayout>{page}</ApiKeysLayout>
  </SettingsLayout>
)
export default AuthSettings
