import { PermissionAction } from '@supabase/shared-types/out/constants'

import { EditWrapper } from 'components/interfaces/Database'
import ProjectIntegrationsLayout from 'components/layouts/ProjectIntegrationsLayout/ProjectIntegrationsLayout'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const DatabaseWrappersNew: NextPageWithLayout = () => {
  const canReadWrappers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'wrappers')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadWrappers) {
    return <NoPermission isFullPage resourceText="view foreign data wrappers" />
  }

  return <EditWrapper />
}

DatabaseWrappersNew.getLayout = (page) => (
  <ProjectIntegrationsLayout title="Wrappers">{page}</ProjectIntegrationsLayout>
)

export default DatabaseWrappersNew
