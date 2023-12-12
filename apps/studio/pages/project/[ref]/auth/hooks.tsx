import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'

import BasicHooksConfig from 'components/interfaces/Auth/Hooks/BasicHooksConfig'
import EnterpriseHooksConfig from 'components/interfaces/Auth/Hooks/EnterpriseHooksConfig'
import { AuthLayout } from 'components/layouts'
import { FormsContainer } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'

const Hooks: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()

  if (!canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth hooks" />
  } else {
    return (
      <FormsContainer>
        <div className="flex flex-col gap-8">
          <BasicHooksConfig />
          <EnterpriseHooksConfig />
        </div>
      </FormsContainer>
    )
  }
}

Hooks.getLayout = (page) => {
  return <AuthLayout>{page}</AuthLayout>
}

export default Hooks
