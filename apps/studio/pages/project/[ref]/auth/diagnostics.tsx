import { PermissionAction } from '@supabase/shared-types/out/constants'

import DiagnosticsPanel from 'components/interfaces/Auth/DiagnosticsPanel'
import { AuthPoliciesLayout } from 'components/layouts/AuthLayout/AuthPoliciesLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const AuthDiagnosticsPage: NextPageWithLayout = () => {
  const canReadAuthSettings = useCheckPermissions(PermissionAction.READ, 'custom_config_gotrue')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your RLS diagnostics" />
  }

  return (
    <ScaffoldContainer>
      <div className="p-4">
        <DiagnosticsPanel />
      </div>
    </ScaffoldContainer>
  )
}

AuthDiagnosticsPage.getLayout = (page) => <AuthPoliciesLayout>{page}</AuthPoliciesLayout>

export default AuthDiagnosticsPage
