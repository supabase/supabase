import { PermissionAction } from '@supabase/shared-types/out/constants'

import { AuthProvidersForm } from 'components/interfaces/Auth'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { FormsContainer } from 'components/ui/Forms/FormsContainer'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth provider settings" />
  } else {
    return (
      <FormsContainer className="w-full">
        <AuthProvidersForm />
      </FormsContainer>
    )
  }
}

PageLayout.getLayout = (page) => {
  return (
    <AppLayout>
      <DefaultLayout>
        <AuthLayout>{page}</AuthLayout>
      </DefaultLayout>
    </AppLayout>
  )
}

export default PageLayout
