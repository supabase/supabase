import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { useStore, checkPermissions } from 'hooks'
import { AuthLayout } from 'components/layouts'
import { EmailTemplates } from 'components/interfaces'
import { FormsContainer } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'

const PageLayout: NextPageWithLayout = () => {
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
        <EmailTemplates />
      </FormsContainer>
    )
  } else {
    return <div />
  }
}

PageLayout.getLayout = (page) => {
  return <AuthLayout>{page}</AuthLayout>
}

export default observer(PageLayout)
