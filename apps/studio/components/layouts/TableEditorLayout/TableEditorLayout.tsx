import { PermissionAction } from '@supabase/shared-types/out/constants'
import { PropsWithChildren } from 'react'

import { SaveQueueActionBar } from '@/components/grid/components/footer/operations/SaveQueueActionBar'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { ProjectLayoutWithAuth } from '../ProjectLayout'

export const TableEditorLayout = ({ children }: PropsWithChildren<{}>) => {
  const { can: canReadTables, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
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

  return (
    <>
      {children}
      <SaveQueueActionBar />
    </>
  )
}
