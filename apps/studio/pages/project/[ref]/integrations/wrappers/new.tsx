import { PermissionAction } from '@supabase/shared-types/out/constants'

import { CreateWrapper } from 'components/interfaces/Database'
import ProjectIntegrationsLayout from 'components/layouts/ProjectIntegrationsLayout/ProjectIntegrationsLayout'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const DatabaseWrappersNew: NextPageWithLayout = () => {
  const canCreateWrappers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canCreateWrappers) {
    return <NoPermission isFullPage resourceText="create foreign data wrappers" />
  }

  return <CreateWrapper />
}

DatabaseWrappersNew.getLayout = (page) => (
  <ProjectIntegrationsLayout title="Wrappers">{page}</ProjectIntegrationsLayout>
)

export default DatabaseWrappersNew
