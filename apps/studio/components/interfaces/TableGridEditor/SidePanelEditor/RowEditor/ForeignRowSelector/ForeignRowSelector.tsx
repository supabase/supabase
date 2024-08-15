import type { PostgresTable } from '@supabase/postgres-meta'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import {
  formatFilterURLParams,
  formatSortURLParams,
  parseSupaTable,
} from 'components/grid/SupabaseGrid.utils'
import RefreshButton from 'components/grid/components/header/RefreshButton'
import FilterPopover from 'components/grid/components/header/filter/FilterPopover'
import { SortPopover } from 'components/grid/components/header/sort'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useTableQuery } from 'data/tables/table-query'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { SidePanel } from 'ui'
import ActionBar from '../../ActionBar'
import { ForeignKey } from '../../ForeignKeySelector/ForeignKeySelector.types'
import { useEncryptedColumns } from '../../SidePanelEditor.utils'
import Pagination from './Pagination'
import SelectorGrid from './SelectorGrid'

export interface ForeignRowSelectorProps {
  visible: boolean
  foreignKey?: ForeignKey
  onSelect: (value?: { [key: string]: any }) => void
  closePanel: () => void
}

const ForeignRowSelector = ({
  visible,
  foreignKey,
  onSelect,
  closePanel,
}: ForeignRowSelectorProps) => {
  const { project } = useProjectContext()

  const { tableId: _tableId, schema: schemaName, table: tableName, columns } = foreignKey ?? {}
  const tableId = _tableId ? Number(_tableId) : undefined

  const { data: table } = useTableQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: tableId,
  })

  const encryptedColumns = useEncryptedColumns({ schemaName, tableName })

  const supaTable =
    table &&
    parseSupaTable(
      {
        table: table as PostgresTable,
        columns: (table as PostgresTable).columns ?? [],
        primaryKeys: (table as PostgresTable).primary_keys,
        relationships: (table as PostgresTable).relationships,
      },
      encryptedColumns
    )

  const [params, setParams] = useState<any>({ filter: [], sort: [] })

  const sorts = formatSortURLParams(table?.name || '', params.sort ?? [])
  const filters = formatFilterURLParams(params.filter ?? [])

  const rowsPerPage = 100
  const [page, setPage] = useState(1)

  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  const { data, isLoading, isSuccess, isError, isRefetching } = useTableRowsQuery(
    {
      queryKey: [schemaName, tableName],
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      table: supaTable,
      sorts,
      filters,
      page,
      limit: rowsPerPage,
      impersonatedRole: roleImpersonationState.role,
    },
    {
      keepPreviousData: true,
    }
  )

  return (
    <SidePanel
      visible={visible}
      size="large"
      header={
        <div>
          Select a record to reference from{' '}
          <code className="font-mono text-sm">
            {schemaName}.{tableName}
          </code>
        </div>
      }
      onCancel={closePanel}
      customFooter={<ActionBar hideApply backButtonLabel="Cancel" closePanel={closePanel} />}
    >
      <SidePanel.Content className="h-full !px-0">
        <div className="h-full">
          {isLoading && (
            <div className="flex h-full py-6 flex-col items-center justify-center space-y-2">
              <Loader2 size={14} className="animate-spin" />
              <p className="text-sm text-foreground-light">Loading rows</p>
            </div>
          )}

          {isError && (
            <div className="flex h-full py-6 flex-col items-center justify-center">
              <p className="text-sm text-foreground-light">
                Unable to load rows from{' '}
                <code>
                  {schemaName}.{tableName}
                </code>
                . Please try again or contact support.
              </p>
            </div>
          )}

          {isSuccess && supaTable && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between my-2 mx-3">
                <div className="flex items-center">
                  <RefreshButton table={supaTable} isRefetching={isRefetching} />
                  <FilterPopover
                    table={supaTable}
                    filters={params.filter ?? []}
                    setParams={(...args) => {
                      // Reset page to 1 when filters change
                      if (page > 1) {
                        setPage(1)
                      }

                      setParams(...args)
                    }}
                  />
                  <DndProvider backend={HTML5Backend} context={window}>
                    <SortPopover
                      table={supaTable}
                      sorts={params.sort ?? []}
                      setParams={setParams}
                    />
                  </DndProvider>
                </div>

                <Pagination
                  page={page}
                  setPage={setPage}
                  rowsPerPage={rowsPerPage}
                  currentPageRowsCount={data?.rows.length ?? 0}
                  isLoading={isRefetching}
                />
              </div>

              {data.rows.length > 0 ? (
                <SelectorGrid
                  table={supaTable}
                  rows={data.rows}
                  onRowSelect={(row) => {
                    const value = columns?.reduce((a, b) => {
                      return { ...a, [b.source]: row[b.target] }
                    }, {})
                    onSelect(value)
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center border-b border-t border-default">
                  <span className="text-foreground-light text-sm">No Rows Found</span>
                </div>
              )}
            </div>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default ForeignRowSelector
