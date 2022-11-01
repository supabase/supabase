import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { useStore, checkPermissions } from 'hooks'
import { AuthLayout } from 'components/layouts'

import NoPermission from 'components/ui/NoPermission'
import RedirectDomains from 'components/interfaces/Auth/RedirectDomains/RedirectDomains'
import { FormsContainer } from 'components/ui/Forms'
import SiteUrl from 'components/interfaces/Auth/SiteUrl/SiteUrl'

const URLConfiguration: NextPageWithLayout = () => {
  const { ui, authConfig } = useStore()

  useEffect(() => {
    authConfig.load()
  }, [ui.selectedProjectRef])

  const canReadAuthSettings = checkPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (!canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  } else if (authConfig) {
    return (
      <FormsContainer>
        <SiteUrl />
        <RedirectDomains />
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
