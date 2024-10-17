import { PermissionAction } from '@supabase/shared-types/out/constants'

import { CreateWrapper } from 'components/interfaces/Database'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
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

DatabaseWrappersNew.getLayout = (page) => <DatabaseLayout title="Wrappers">{page}</DatabaseLayout>

export default DatabaseWrappersNew
