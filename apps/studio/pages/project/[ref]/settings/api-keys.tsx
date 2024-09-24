import { PermissionAction } from '@supabase/shared-types/out/constants'

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

import PublishableAPIKeys from 'components/interfaces/APIKeys/PublishableAPIKeys'
import SecretAPIKeys from 'components/interfaces/APIKeys/SecretAPIKeys'
import LegacyAPIKeys from 'components/interfaces/APIKeys/LegacyAPIKeys'

const AuthSettings: NextPageWithLayout = () => {
  const isPermissionsLoaded = usePermissionsLoaded()
  // TODO: check if these permissions cover third party auth as well
  const canReadAPIKeys = useCheckPermissions(PermissionAction.READ, 'api_keys')

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader>
          <ScaffoldTitle>API Keys</ScaffoldTitle>
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
          <>
            <PublishableAPIKeys />
            <SecretAPIKeys />
            <LegacyAPIKeys />
          </>
        )}
      </ScaffoldContainer>
    </>
  )
}

AuthSettings.getLayout = (page) => <SettingsLayout>{page}</SettingsLayout>
export default AuthSettings
