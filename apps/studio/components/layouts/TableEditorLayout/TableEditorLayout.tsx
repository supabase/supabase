import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { PropsWithChildren, useEffect, useMemo } from 'react'

import NoPermission from 'components/ui/NoPermission'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useCheckPermissions, usePermissionsLoaded, useSelectedProject, useStore } from 'hooks'
import { ProjectLayoutWithAuth } from '../'
import TableEditorMenu from './TableEditorMenu'

const TableEditorLayout = ({ children }: PropsWithChildren<{}>) => {
  const { vault, ui } = useStore()
  const project = useSelectedProject()

  const canReadTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')
  const isPermissionsLoaded = usePermissionsLoaded()

  const { data } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const vaultExtension = (data ?? []).find((ext) => ext.name === 'supabase_vault')
  const isVaultEnabled = vaultExtension !== undefined && vaultExtension.installed_version !== null

  useEffect(() => {
    if (isVaultEnabled) {
      vault.load()
    }
  }, [ui.selectedProjectRef, isVaultEnabled])

  const tableEditorMenu = useMemo(() => <TableEditorMenu />, [])

  if (isPermissionsLoaded && !canReadTables) {
    debugger
    return (
      <ProjectLayoutWithAuth isBlocking={false}>
        <NoPermission isFullPage resourceText="view tables from this project" />
      </ProjectLayoutWithAuth>
    )
  }

  return (
    <ProjectLayoutWithAuth product="Table Editor" productMenu={tableEditorMenu} isBlocking={false}>
      {children}
    </ProjectLayoutWithAuth>
  )
}

export default observer(TableEditorLayout)
