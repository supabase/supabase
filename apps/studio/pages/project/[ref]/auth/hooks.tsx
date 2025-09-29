import { PermissionAction } from '@supabase/shared-types/out/constants'

import { HooksListing } from 'components/interfaces/Auth/Hooks/HooksListing'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { GenericSkeletonLoader } from 'ui-patterns'

const Hooks: NextPageWithLayout = () => {
  const { can: canReadAuthSettings, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth hooks" />
  }

  return (
    <ScaffoldContainer>
      {!isPermissionsLoaded ? (
        <ScaffoldSection isFullWidth>
          <GenericSkeletonLoader />
        </ScaffoldSection>
      ) : (
        <HooksListing />
      )}
    </ScaffoldContainer>
  )
}
const secondaryActions = [<DocsButton key="docs" href={`${DOCS_URL}/guides/auth/auth-hooks`} />]

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
