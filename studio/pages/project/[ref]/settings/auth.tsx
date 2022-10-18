import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useStore } from 'hooks'
import AutoSchemaForm from 'components/interfaces/Auth/AutoSchemaForm'
import RedirectDomains from 'components/interfaces/Auth/RedirectDomains/RedirectDomains'
import { AuthLayout, SettingsLayout } from 'components/layouts'
import { FormsContainer } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'

const PageLayout: NextPageWithLayout = () => {
  const { ui, authConfig } = useStore()

  useEffect(() => {
    authConfig.load()
  }, [ui.selectedProjectRef])

  const canReadAuthSettings = checkPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (!canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's authentication settings" />
  } else if (authConfig) {
    return (
      <FormsContainer>
        <AutoSchemaForm />
        <RedirectDomains />
      </FormsContainer>
    )
  } else {
    return <div />
  }
}

PageLayout.getLayout = (page) => {
  return <SettingsLayout>{page}</SettingsLayout>
}

export default observer(PageLayout)
