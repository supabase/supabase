import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'

import RedirectUrls from 'components/interfaces/Auth/RedirectUrls/RedirectUrls'
import SiteUrl from 'components/interfaces/Auth/SiteUrl/SiteUrl'
import { AuthLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { FormsContainer } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'

const URLConfiguration: NextPageWithLayout = () => {
  const { authConfig } = useStore()
  const { project } = useProjectContext()

  useEffect(() => {
    authConfig.load()
  }, [project?.ref])

  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (!canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  } else if (authConfig) {
    return (
      <FormsContainer>
        <SiteUrl />
        <RedirectUrls />
      </FormsContainer>
    )
  } else {
    return <div />
  }
}

URLConfiguration.getLayout = (page) => {
  return <AuthLayout>{page}</AuthLayout>
}

export default observer(URLConfiguration)
