import { PermissionAction } from '@supabase/shared-types/out/constants'
import { PropsWithChildren } from 'react'

import NoPermission from 'components/ui/NoPermission'
import {
  useAsyncCheckProjectPermissions,
  usePermissionsLoaded,
} from 'hooks/misc/useCheckPermissions'
import { ProjectLayoutWithAuth } from '../ProjectLayout/ProjectLayout'

const TableEditorLayout = ({ children }: PropsWithChildren<{}>) => {
  const isPermissionsLoaded = usePermissionsLoaded()
  const { can: canReadTables } = useAsyncCheckProjectPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'tables'
  )

  if (isPermissionsLoaded && !canReadTables) {
    return (
      <ProjectLayoutWithAuth isBlocking={false}>
        <NoPermission isFullPage resourceText="view tables from this project" />
      </ProjectLayoutWithAuth>
    )
  }

  return children
}

export default TableEditorLayout
