import { PermissionAction } from '@supabase/shared-types/out/constants'

import PolicyTestsList from 'components/interfaces/Auth/PolicyTests/PolicyTestsList'
import { AuthPoliciesLayout } from 'components/layouts/AuthLayout/AuthPoliciesLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const PolicyTestsPage: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth settings" />
  }

  return (
    <ScaffoldContainer size="large">
      <PolicyTestsList />
    </ScaffoldContainer>
  )
}

PolicyTestsPage.getLayout = (page) => <AuthPoliciesLayout>{page}</AuthPoliciesLayout>

export default PolicyTestsPage
