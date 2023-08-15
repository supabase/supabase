import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'

import { AuthProvidersForm } from 'components/interfaces'
import { AuthLayout } from 'components/layouts'
import { FormsContainer } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { authConfig } = useStore()
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')

  if (!canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth provider settings" />
  } else if (authConfig) {
    return (
      <FormsContainer>
        <AuthProvidersForm />
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
