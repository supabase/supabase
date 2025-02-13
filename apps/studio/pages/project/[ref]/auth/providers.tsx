import { PermissionAction } from '@supabase/shared-types/out/constants'

import { AuthProvidersForm, BasicAuthSettingsForm } from 'components/interfaces/Auth'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageContainer, PageLayout } from 'components/layouts/PageLayout'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const ProvidersPage: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth provider settings" />
  }

  return (
    <PageContainer className="pb-16">
      <BasicAuthSettingsForm />
      <AuthProvidersForm />
    </PageContainer>
  )
}

ProvidersPage.getLayout = (page) => {
  const navigationItems = [
    {
      label: 'Supabase Auth',
      href: `/project/[ref]/auth/providers`,
    },
    {
      label: 'Third Party Auth',
      href: `/project/[ref]/auth/third-party`,
    },
  ]

  return (
    <DefaultLayout>
      <AuthLayout>
        <PageLayout
          title="Sign In / Up"
          subtitle="Configure authentication providers and login methods for your users"
          navigationItems={navigationItems}
        >
          {page}
        </PageLayout>
      </AuthLayout>
    </DefaultLayout>
  )
}

export default ProvidersPage
