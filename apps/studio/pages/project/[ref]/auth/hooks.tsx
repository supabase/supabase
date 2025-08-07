import { PermissionAction } from '@supabase/shared-types/out/constants'

import { HooksListing } from 'components/interfaces/Auth/Hooks/HooksListing'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import { DocsButton } from 'components/ui/DocsButton'

const Hooks: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth hooks" />
  }

  return (
    <ScaffoldContainer>
      <HooksListing />
    </ScaffoldContainer>
  )
}
const secondaryActions = [
  <DocsButton key="docs" href="https://supabase.com/docs/guides/auth/auth-hooks" />,
]

Hooks.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Auth Hooks"
        subtitle="Use Postgres functions or HTTP endpoints to customize the behavior of Supabase Auth to meet your needs"
        secondaryActions={secondaryActions}
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default Hooks
