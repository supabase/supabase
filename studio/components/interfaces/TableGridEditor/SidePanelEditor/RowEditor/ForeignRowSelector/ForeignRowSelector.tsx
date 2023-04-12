import { PostgresTable } from '@supabase/postgres-meta'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { parseSupaTable } from 'components/grid'
import RefreshButton from 'components/grid/components/header/RefreshButton'
import FilterPopover from 'components/grid/components/header/filter'
import SortPopover from 'components/grid/components/header/sort'
import { formatFilterURLParams, formatSortURLParams } from 'components/grid/SupabaseGrid.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'
import { useStore } from 'hooks'
import { IconLoader, SidePanel } from 'ui'

import ActionBar from '../../ActionBar'
import { useEncryptedColumns } from './ForeignRowSelector.utils'
import SelectorGrid from './SelectorGrid'
import { useEffect, useState } from 'react'
import Pagination from './Pagination'

export interface ForeignRowSelectorProps {
  visible: boolean
  foreignKey?: ForeignKeyConstraint
  onSelect: (value: any) => void
  closePanel: () => void
}

const ForeignRowSelector = ({
  visible,
  foreignKey,
  onSelect,
  closePanel,
}: ForeignRowSelectorProps) => {
  const { meta } = useStore()
  const { project } = useProjectContext()

  const {
    target_id: tableId,
    target_schema: schemaName,
    target_table: tableName,
    target_columns: columnName,
  } = foreignKey ?? {}

  const table = tableId ? meta.tables.byId(tableId) : undefined

  useEffect(() => {
    if (!table && tableId) {
      meta.tables.loadById(tableId)
    }
  }, [table, tableId])

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

  const sorts = formatSortURLParams(params.sort ?? [])
  const filters = formatFilterURLParams(params.filter ?? [])

  const rowsPerPage = 100
  const [page, setPage] = useState(1)

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
              <IconLoader className="animate-spin" />
              <p className="text-sm text-scale-1100">Loading rows</p>
            </div>
          )}

          {isError && (
            <div className="flex h-full py-6 flex-col items-center justify-center">
              <p className="text-sm text-scale-1100">
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
                  <DndProvider backend={HTML5Backend}>
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
                  onRowSelect={(row) => onSelect(row[columnName ?? ''])}
                />
              ) : (
                <div className="flex h-full items-center justify-center border-b border-t border-scale-500">
                  <span className="text-scale-1100 text-sm">No Rows Found</span>
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
