import { PermissionAction } from '@supabase/shared-types/out/constants'
import { isUndefined } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { useParams } from 'common'
import { SupabaseGrid } from 'components/grid/SupabaseGrid'
import { useLoadTableEditorStateFromLocalStorageIntoUrl } from 'components/grid/SupabaseGrid.utils'
import { useEditorType } from 'components/layouts/editors/EditorsLayout.hooks'
import {
  Entity,
  isMaterializedView,
  isTableLike,
  isView,
} from 'data/table-editor/table-editor-types'
import { useGetTables } from 'data/tables/tables-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useUrlState } from 'hooks/ui/useUrlState'
import { PROTECTED_SCHEMAS } from 'lib/constants/schemas'
import { useAppStateSnapshot } from 'state/app-state'
import { TableEditorTableStateContextProvider } from 'state/table-editor-table'
import { createTabId, handleTabClose, makeActiveTabPermanent, useTabsStore } from 'state/tabs'
import { Button } from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'
import { useIsTableEditorTabsEnabled } from '../App/FeaturePreview/FeaturePreviewContext'
import DeleteConfirmationDialogs from './DeleteConfirmationDialogs'
import SidePanelEditor from './SidePanelEditor/SidePanelEditor'
import TableDefinition from './TableDefinition'

export interface TableGridEditorProps {
  isLoadingSelectedTable?: boolean
  selectedTable?: Entity
}

export const TableGridEditor = ({
  isLoadingSelectedTable = false,
  selectedTable,
}: TableGridEditorProps) => {
  const router = useRouter()
  const editor = useEditorType()
  const project = useSelectedProject()
  const appSnap = useAppStateSnapshot()
  const { ref: projectRef, id } = useParams()

  const tabs = useTabsStore(projectRef)
  const isTableEditorTabsEnabled = useIsTableEditorTabsEnabled()
  const { selectedSchema } = useQuerySchemaState()

  useLoadTableEditorStateFromLocalStorageIntoUrl({
    projectRef,
    table: selectedTable,
  })

  const [{ view: selectedView = 'data' }] = useUrlState()

  const canEditTables = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')
  const canEditColumns = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'columns')
  const isReadOnly = !canEditTables && !canEditColumns
  const tabId = !!id ? tabs.openTabs.find((x) => x.endsWith(id)) : undefined

  const getTables = useGetTables({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const onClearDashboardHistory = () => {
    if (projectRef && editor) {
      appSnap.setDashboardHistory(projectRef, editor === 'table' ? 'editor' : editor, undefined)
    }
  }

  const onTableCreated = useCallback(
    (table: { id: number }) => {
      router.push(`/project/${projectRef}/editor/${table.id}`)
    },
    [projectRef, router]
  )

  const onTableDeleted = useCallback(async () => {
    // For simplicity for now, we just open the first table within the same schema
    if (isTableEditorTabsEnabled && selectedTable) {
      // Close tab
      const tabId = createTabId(selectedTable.entity_type, { id: selectedTable.id })
      handleTabClose({ ref: projectRef, id: tabId, router, editor, onClearDashboardHistory })
    } else {
      const tables = await getTables(selectedSchema)
      if (tables.length > 0) {
        router.push(`/project/${projectRef}/editor/${tables[0].id}`)
      } else {
        router.push(`/project/${projectRef}/editor`)
      }
    }
  }, [getTables, isTableEditorTabsEnabled, projectRef, router, selectedSchema])

  // NOTE: DO NOT PUT HOOKS AFTER THIS LINE
  if (isLoadingSelectedTable || !projectRef) {
    return (
      <div className="flex flex-col">
        <div className="h-10 bg-dash-sidebar dark:bg-surface-100" />
        <div className="h-9 border-y" />
        <div className="p-2 col-span-full">
          <GenericSkeletonLoader />
        </div>
      </div>
    )
  }

  if (isUndefined(selectedTable)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-[400px]">
          <Admonition
            type="default"
            title={`Unable to find your table with ID ${id}`}
            description="This table doesn't exist in your database"
          >
            {isTableEditorTabsEnabled && (
              <Button
                type="default"
                className="mt-2"
                onClick={() => {
                  if (tabId) {
                    handleTabClose({
                      ref: projectRef,
                      id: tabId,
                      router,
                      editor,
                      onClearDashboardHistory,
                    })
                  }
                }}
              >
                Close tab
              </Button>
            )}
          </Admonition>
        </div>
      </div>
    )
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
        <DeleteConfirmationDialogs
          selectedTable={isTableLike(selectedTable) ? selectedTable : undefined}
          onTableDeleted={onTableDeleted}
        />
      </TableEditorTableStateContextProvider>
    </div>
  )
}
