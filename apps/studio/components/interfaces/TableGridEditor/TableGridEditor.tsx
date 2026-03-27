import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useCallback } from 'react'
import { useRouter } from 'next/compat/router'

import { useParams } from 'common'
import { Footer } from 'components/grid/components/footer/Footer'
import { SupabaseGrid } from 'components/grid/SupabaseGrid'
import { useSyncTableEditorStateFromLocalStorageWithUrl } from 'components/grid/SupabaseGrid.utils'
import {
  isForeignTable,
  isMaterializedView,
  isTableLike,
  isView,
} from 'data/table-editor/table-editor-types'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useDashboardHistory } from 'hooks/misc/useDashboardHistory'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useUrlState } from 'hooks/ui/useUrlState'
import { useIsProtectedSchema } from 'hooks/useProtectedSchemas'
import { TableEditorTableStateContextProvider } from 'state/table-editor-table'
import { createTabId, useTabsStateSnapshot } from 'state/tabs'
import { Button } from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'

import type { Entity, TableLike } from 'data/table-editor/table-editor-types'
import { V2TableDataGrid } from '@/components/v2/views/V2TableDataGrid'
import DeleteConfirmationDialogs from './DeleteConfirmationDialogs'
import { SidePanelEditor } from './SidePanelEditor/SidePanelEditor'
import { TableDefinition } from './TableDefinition'

export interface TableGridEditorProps {
  isLoadingSelectedTable?: boolean
  selectedTable?: Entity
  variant?: 'pages' | 'v2'
  projectRefOverride?: string
  tableIdOverride?: string | number
}

export const TableGridEditor = ({
  isLoadingSelectedTable = false,
  selectedTable,
  variant = 'pages',
  projectRefOverride,
  tableIdOverride,
}: TableGridEditorProps) => {
  const router = useRouter()
  const { ref: routeProjectRef, id: routeId } = useParams()
  const projectRef = projectRefOverride ?? routeProjectRef
  const id = tableIdOverride ? String(tableIdOverride) : routeId
  const { setLastVisitedTable } = useDashboardHistory()
  const { selectedSchema } = useQuerySchemaState()

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
      if (variant === 'v2') {
        const base = projectRef ? `/v2/project/${projectRef}` : ''
        if (router) {
          router.push(
            `${base}/data/tables/${table.id}/data${
              !!selectedSchema ? `?schema=${selectedSchema}` : ''
            }`
          )
        } else if (typeof window !== 'undefined') {
          window.location.assign(
            `${base}/data/tables/${table.id}/data${
              !!selectedSchema ? `?schema=${selectedSchema}` : ''
            }`
          )
        }
        return
      }

      if (!router) return
      router.push(
        `/project/${projectRef}/editor/${table.id}${
          !!selectedSchema ? `?schema=${selectedSchema}` : ''
        }`
      )
    },
    [projectRef, router, selectedSchema, variant]
  )

  const closeLegacyTab = useCallback(
    (id: string) => {
      if (!router) return
      tabs.handleTabClose({
        id,
        router,
        editor: 'table',
        onClearDashboardHistory: () => setLastVisitedTable(undefined),
      })
    },
    [router, setLastVisitedTable, tabs]
  )

  const onTableDeleted = useCallback(async () => {
    if (!selectedTable) return

    // For now, just close the deleted table tab.
    // v2 uses v2 URLs, pages uses the legacy tab-close router logic.
    const tabId = createTabId(selectedTable.entity_type, { id: selectedTable.id })

    if (variant === 'v2') {
      tabs.removeTab(tabId)
      setLastVisitedTable(undefined)

      const base = projectRef ? `/v2/project/${projectRef}` : ''
      if (router) {
        router.push(`${base}/data/tables`)
      } else if (typeof window !== 'undefined') {
        window.location.assign(`${base}/data/tables`)
      }
      return
    }

    closeLegacyTab(tabId)
  }, [closeLegacyTab, projectRef, router, selectedTable, tabs, setLastVisitedTable, variant])

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
    <div className="h-full" onPointerDownCapture={() => tabs.makeActiveTabPermanent()}>
      {!selectedTable ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-[400px]">
            <Admonition
              type="default"
              title={`Unable to find your table with ID ${id}`}
              description="This table doesn't exist in your database"
            >
              {variant === 'v2' ? (
                !!tabId ? (
                  <Button
                    type="default"
                    className="mt-2"
                    onClick={() => {
                      tabs.removeTab(tabId)
                      setLastVisitedTable(undefined)
                      const base = projectRef ? `/v2/project/${projectRef}` : ''
                      if (router) {
                        router.push(`${base}/data/tables`)
                      } else if (typeof window !== 'undefined') {
                        window.location.assign(`${base}/data/tables`)
                      }
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
                    <Link
                      href={`/v2/project/${projectRef}/data/tables/${openTabs[0].split('-')[1]}/data`}
                    >
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
                    <Link href={`/v2/project/${projectRef}/data/tables`}>Head back</Link>
                  </Button>
                )
              ) : !!tabId ? (
                <Button type="default" className="mt-2" onClick={() => closeLegacyTab(tabId)}>
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
            {(isViewSelected || isTableSelected) && selectedView === 'definition' ? (
              <TableDefinition entity={selectedTable} />
            ) : variant === 'v2' && selectedView === 'data' ? (
              <>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <V2TableDataGrid
                    projectRef={projectRef}
                    tableId={selectedTable?.id ?? (id ? Number(id) : undefined)}
                  />
                </div>
                <Footer />
              </>
            ) : null}
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
