import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { useParams } from 'common'
import { SupabaseGrid } from 'components/grid/SupabaseGrid'
import { useSyncTableEditorStateFromLocalStorageWithUrl } from 'components/grid/SupabaseGrid.utils'
import {
  Entity,
  isForeignTable,
  isMaterializedView,
  isTableLike,
  isView,
  TableLike,
} from 'data/table-editor/table-editor-types'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useDashboardHistory } from 'hooks/misc/useDashboardHistory'
import { useUrlState } from 'hooks/ui/useUrlState'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { TableEditorTableStateContextProvider } from 'state/table-editor-table'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import { Button } from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'
import DeleteConfirmationDialogs from './DeleteConfirmationDialogs'
import SidePanelEditor from './SidePanelEditor/SidePanelEditor'
import { TableDefinition } from './TableDefinition'

export interface TableGridEditorProps {
  isLoadingSelectedTable?: boolean
  selectedTable?: Entity
}

export const TableGridEditor = ({
  isLoadingSelectedTable = false,
  selectedTable,
}: TableGridEditorProps) => {
  const router = useRouter()
  const { ref: projectRef, id } = useParams()
  const { setLastVisitedTable } = useDashboardHistory()

  const tabs = useTabsStateSnapshot()

  useSyncTableEditorStateFromLocalStorageWithUrl({
    projectRef,
    table: selectedTable,
  })

  const [{ view: selectedView = 'data' }] = useUrlState()
  const { can: canEditTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )
  const { can: canEditColumns } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'columns'
  )
  const isReadOnly = !canEditTables && !canEditColumns
  const tabId = !!id ? tabs.openTabs.find((x) => x.endsWith(id)) : undefined
  const openTabs = tabs.openTabs.filter((x) => !x.startsWith('sql'))

  const onTableCreated = useCallback(
    (table: { id: number }) => {
      router.push(`/project/${projectRef}/editor/${table.id}`)
    },
    [projectRef, router]
  )

  const onTableDeleted = useCallback(async () => {
    // For simplicity for now, we just open the first table within the same schema
    if (selectedTable) {
      // Close tab
      const tabId = createTabId(selectedTable.entity_type, { id: selectedTable.id })
      tabs.handleTabClose({
        id: tabId,
        router,
        editor: 'table',
        onClearDashboardHistory: () => setLastVisitedTable(undefined),
      })
    }
  }, [router, selectedTable, tabs])

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedTable?.schema ?? '' })

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

  const isViewSelected = isView(selectedTable) || isMaterializedView(selectedTable)
  const isTableSelected = isTableLike(selectedTable)
  const isForeignTableSelected = isForeignTable(selectedTable)

  const canEditViaTableEditor = isTableSelected && !isSchemaLocked
  const editable = !isReadOnly && canEditViaTableEditor

  const gridKey = !!selectedTable
    ? `${selectedTable.schema}_${selectedTable.name}`
    : 'unknown-table'

  /** [Joshen] We're going to need to refactor SupabaseGrid eventually to make the code here more readable
   * For context we previously built the SupabaseGrid as a reusable npm component, but eventually decided
   * to just integrate it directly into the dashboard. The header, and body (+footer) should be decoupled.
   */

  return (
    // When any click happens in a table tab, the tab becomes permanent
    <div className="h-full" onClick={() => tabs.makeActiveTabPermanent()}>
      {!selectedTable ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-[400px]">
            <Admonition
              type="default"
              title={`Unable to find your table with ID ${id}`}
              description="This table doesn't exist in your database"
            >
              {!!tabId ? (
                <Button
                  type="default"
                  className="mt-2"
                  onClick={() => {
                    tabs.handleTabClose({
                      id: tabId,
                      router,
                      editor: 'table',
                      onClearDashboardHistory: () => setLastVisitedTable(undefined),
                    })
                  }}
                >
                  Close tab
                </Button>
              ) : openTabs.length > 0 ? (
                <Button
                  asChild
                  type="default"
                  className="mt-2"
                  onClick={() => setLastVisitedTable(undefined)}
                >
                  <Link href={`/project/${projectRef}/editor/${openTabs[0].split('-')[1]}`}>
                    Close tab
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  type="default"
                  className="mt-2"
                  onClick={() => setLastVisitedTable(undefined)}
                >
                  <Link href={`/project/${projectRef}/editor`}>Head back</Link>
                </Button>
              )}
            </Admonition>
          </div>
        </div>
      ) : (
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

          <DeleteConfirmationDialogs
            selectedTable={isTableSelected ? selectedTable : undefined}
            onTableDeleted={onTableDeleted}
          />
        </TableEditorTableStateContextProvider>
      )}

      <SidePanelEditor
        editable={editable}
        selectedTable={
          isTableSelected || isForeignTableSelected ? (selectedTable as TableLike) : undefined
        }
        onTableCreated={onTableCreated}
      />
    </div>
  )
}
