import { PermissionAction } from '@supabase/shared-types/out/constants'
import { isUndefined } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { useParams } from 'common'
import { SupabaseGrid } from 'components/grid/SupabaseGrid'
import { useLoadTableEditorStateFromLocalStorageIntoUrl } from 'components/grid/SupabaseGrid.utils'
import {
  Entity,
  isMaterializedView,
  isTableLike,
  isView,
} from 'data/table-editor/table-editor-types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useUrlState } from 'hooks/ui/useUrlState'
import { PROTECTED_SCHEMAS } from 'lib/constants/schemas'
import { TableEditorTableStateContextProvider } from 'state/table-editor-table'
import { makeActiveTabPermanent } from 'state/tabs'
import { TableGridSkeletonLoader } from './LoadingState'
import NotFoundState from './NotFoundState'
import SidePanelEditor from './SidePanelEditor/SidePanelEditor'
import TableDefinition from './TableDefinition'

export interface TableGridEditorProps {
  isLoadingSelectedTable?: boolean
  selectedTable?: Entity
}

const TableGridEditor = ({
  isLoadingSelectedTable = false,
  selectedTable,
}: TableGridEditorProps) => {
  const router = useRouter()
  const project = useSelectedProject()
  const { ref: projectRef, id } = useParams()

  useLoadTableEditorStateFromLocalStorageIntoUrl({
    projectRef,
    table: selectedTable,
  })

  const [{ view: selectedView = 'data' }] = useUrlState()

  const canEditTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')
  const canEditColumns = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'columns')
  const isReadOnly = !canEditTables && !canEditColumns

  const onTableCreated = useCallback(
    (table: { id: number }) => {
      router.push(`/project/${projectRef}/editor/${table.id}`)
    },
    [projectRef, router]
  )

  // NOTE: DO NOT PUT HOOKS AFTER THIS LINE
  if (isLoadingSelectedTable || !projectRef) {
    return <TableGridSkeletonLoader />
  }

  if (isUndefined(selectedTable)) {
    return <NotFoundState id={Number(id)} />
  }

  const isViewSelected = isView(selectedTable) || isMaterializedView(selectedTable)
  const isTableSelected = isTableLike(selectedTable)
  const isLocked = PROTECTED_SCHEMAS.includes(selectedTable?.schema ?? '')
  const canEditViaTableEditor = isTableSelected && !isLocked
  const editable = !isReadOnly && canEditViaTableEditor

  const gridKey = `${selectedTable.schema}_${selectedTable.name}`

  /** [Joshen] We're going to need to refactor SupabaseGrid eventually to make the code here more readable
   * For context we previously built the SupabaseGrid as a reusable npm component, but eventually decided
   * to just integrate it directly into the dashboard. The header, and body (+footer) should be decoupled.
   */

  return (
    // When any click happens in a table tab, the tab becomes permanent
    <div className="h-full" onClick={() => makeActiveTabPermanent(project?.ref)}>
      <TableEditorTableStateContextProvider
        key={`table-editor-table-${selectedTable.id}`}
        projectRef={projectRef}
        table={selectedTable}
        editable={editable}
      >
        <SupabaseGrid
          key={gridKey}
          gridProps={{ height: '100%' }}
          customHeader={
            (isViewSelected || isTableSelected) && selectedView === 'definition' ? (
              <div className="flex items-center space-x-2">
                <p>
                  SQL Definition of <code className="text-sm">{selectedTable.name}</code>{' '}
                </p>
                <p className="text-foreground-light text-sm">(Read only)</p>
              </div>
            ) : null
          }
        >
          {(isViewSelected || isTableSelected) && selectedView === 'definition' && (
            <TableDefinition entity={selectedTable} />
          )}
        </SupabaseGrid>

        <SidePanelEditor
          editable={editable}
          selectedTable={isTableLike(selectedTable) ? selectedTable : undefined}
          onTableCreated={onTableCreated}
        />
      </TableEditorTableStateContextProvider>
    </div>
  )
}

export default TableGridEditor
