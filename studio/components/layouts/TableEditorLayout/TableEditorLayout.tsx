import { PropsWithChildren, useEffect } from 'react'
import { noop } from 'lodash'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import { Entity } from 'data/entity-types/entity-type-query'
import ProjectLayout from '../'
import TableEditorMenu from './TableEditorMenu'
import NoPermission from 'components/ui/NoPermission'

export interface TableEditorLayoutProps {
  onAddTable: () => void
  onEditTable: (table: Entity) => void
  onDeleteTable: (table: Entity) => void
  onDuplicateTable: (table: Entity) => void
}

const TableEditorLayout = ({
  onAddTable = noop,
  onEditTable = noop,
  onDeleteTable = noop,
  onDuplicateTable = noop,
  children,
}: PropsWithChildren<TableEditorLayoutProps>) => {
  const { vault, meta, ui } = useStore()

  const canReadTables = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'tables')

  const vaultExtension = meta.extensions.byId('supabase_vault')
  const isVaultEnabled = vaultExtension !== undefined && vaultExtension.installed_version !== null

  useEffect(() => {
    if (ui.selectedProject?.ref) {
      meta.types.load()
      meta.policies.load()
      meta.publications.load()
      meta.extensions.load()
    }
  }, [ui.selectedProject?.ref])

  useEffect(() => {
    if (isVaultEnabled) {
      vault.load()
    }
  }, [ui.selectedProject?.ref, isVaultEnabled])

  if (!canReadTables) {
    return (
      <ProjectLayout>
        <NoPermission isFullPage resourceText="view tables from this project" />
      </ProjectLayout>
    )
  }

  return (
    <ProjectLayout
      product="Table editor"
      productMenu={
        <TableEditorMenu
          onAddTable={onAddTable}
          onEditTable={onEditTable}
          onDeleteTable={onDeleteTable}
          onDuplicateTable={onDuplicateTable}
        />
      }
    >
      {children}
    </ProjectLayout>
  )
}

export default observer(TableEditorLayout)
