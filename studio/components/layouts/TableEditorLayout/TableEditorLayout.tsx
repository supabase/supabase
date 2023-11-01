import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { PropsWithChildren, useEffect } from 'react'

import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, useStore } from 'hooks'
import { ProjectLayoutWithAuth } from '../'
import TableEditorMenu from './TableEditorMenu'

const TableEditorLayout = ({ children }: PropsWithChildren<{}>) => {
  const { vault, meta, ui } = useStore()

  const canReadTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')

  const vaultExtension = meta.extensions.byId('supabase_vault')
  const isVaultEnabled = vaultExtension !== undefined && vaultExtension.installed_version !== null

  useEffect(() => {
    if (ui.selectedProjectRef) {
      meta.types.load()
      meta.policies.load()
      meta.publications.load()
      meta.extensions.load()
    }
  }, [ui.selectedProjectRef])

  useEffect(() => {
    if (isVaultEnabled) {
      vault.load()
    }
  }, [ui.selectedProjectRef, isVaultEnabled])

  if (!canReadTables) {
    return (
      <ProjectLayoutWithAuth>
        <NoPermission isFullPage resourceText="view tables from this project" />
      </ProjectLayoutWithAuth>
    )
  }

  return (
    <ProjectLayoutWithAuth product="Table Editor" productMenu={<TableEditorMenu />}>
      {children}
    </ProjectLayoutWithAuth>
  )
}

export default observer(TableEditorLayout)
