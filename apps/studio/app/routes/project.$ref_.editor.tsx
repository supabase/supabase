import { Outlet } from '@remix-run/react'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { TableEditorLayout } from 'components/layouts'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks'

export default function ProjectEditor() {
  const canReadTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadTables) {
    return (
      <ProjectLayoutWithAuth isBlocking={false}>
        <NoPermission isFullPage resourceText="view tables from this project" />
      </ProjectLayoutWithAuth>
    )
  }

  return (
    <ProjectContextFromParamsProvider>
      <TableEditorLayout>
        <Outlet />
      </TableEditorLayout>
    </ProjectContextFromParamsProvider>
  )
}
