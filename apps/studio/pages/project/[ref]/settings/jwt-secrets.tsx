import { PermissionAction } from '@supabase/shared-types/out/constants'
import JWTSecretKeysTable from 'components/interfaces/JwtSecrets/JWTSecretKeysTable'
import DefaultLayout from 'components/layouts/DefaultLayout'
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

const AuthSettings: NextPageWithLayout = () => {
  const isPermissionsLoaded = usePermissionsLoaded()
  // TODO: check if these permissions cover third party auth as well
  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'api_keys')

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>JWT secret</ScaffoldTitle>
          <ScaffoldDescription>
            Configure API keys that help secure your project
          </ScaffoldDescription>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        {!isPermissionsLoaded ? (
          <GenericSkeletonLoader />
        ) : !canReadAPIKeys ? (
          <NoPermission isFullPage resourceText="access your project's API keys" />
        ) : (
          <JWTSecretKeysTable />
        )}
      </ScaffoldContainer>
    </>
  )
}

AuthSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout>{page}</SettingsLayout>
  </DefaultLayout>
)

export default AuthSettings
