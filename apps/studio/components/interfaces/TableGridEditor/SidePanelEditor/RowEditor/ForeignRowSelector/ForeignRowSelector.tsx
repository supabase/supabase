import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { useParams } from 'common'
import { RefreshButton } from 'components/grid/components/header/RefreshButton'
import { FilterPopoverPrimitive } from 'components/grid/components/header/filter/FilterPopoverPrimitive'
import { SortPopoverPrimitive } from 'components/grid/components/header/sort/SortPopoverPrimitive'
import type { Filter, Sort } from 'components/grid/types'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  RoleImpersonationState,
  useRoleImpersonationStateSnapshot,
} from 'state/role-impersonation-state'
import { TableEditorTableStateContextProvider } from 'state/table-editor-table'
import { Button, SidePanel } from 'ui'
import ActionBar from '../../ActionBar'
import { ForeignKey } from '../../ForeignKeySelector/ForeignKeySelector.types'
import { convertByteaToHex } from '../RowEditor.utils'
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
  const { id } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedTable } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: !!id ? Number(id) : undefined,
  })

  const { tableId: _tableId, schema: schemaName, table: tableName, columns } = foreignKey ?? {}
  const tableId = _tableId ? Number(_tableId) : undefined

  // [Joshen] Only show Set NULL CTA if its a 1:1 foreign key, and source column is nullable
  // As this wouldn't be straightforward for composite foreign keys
  const sourceColumn = (selectedTable?.columns ?? []).find((c) => c.name === columns?.[0].source)
  const isNullable = (columns ?? []).length === 1 && sourceColumn?.is_nullable

  const { data: table } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id: tableId,
  })

  const [{ sort: sorts, filter: filters }, setFiltersAndSorts] = useState<{
    filter: Filter[]
    sort: Sort[]
  }>({ filter: [], sort: [] })

  const onApplyFilters = (appliedFilters: Filter[]) => {
    // Reset page to 1 when filters change
    if (page > 1) {
      setPage(1)
    }

    setFiltersAndSorts((prevParams) => {
      return {
        ...prevParams,
        filter: appliedFilters,
      }
    })
  }

  const onApplySorts = (appliedSorts: Sort[]) => {
    setFiltersAndSorts((prevParams) => {
      return {
        ...prevParams,
        sort: appliedSorts,
      }
    })
  }

  const rowsPerPage = 100
  const [page, setPage] = useState(1)

  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  const { data, isLoading, isSuccess, isError, isRefetching } = useTableRowsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      tableId: table?.id,
      sorts,
      filters,
      page,
      limit: rowsPerPage,
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
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

          {project?.ref && table && isSuccess && (
            <TableEditorTableStateContextProvider
              projectRef={project.ref}
              table={table}
              editable={false}
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between my-2 mx-3">
                  <div className="flex items-center">
                    <RefreshButton tableId={table?.id} isRefetching={isRefetching} />
                    <FilterPopoverPrimitive
                      portal={false}
                      filters={filters}
                      onApplyFilters={onApplyFilters}
                    />
                    <DndProvider backend={HTML5Backend} context={window}>
                      <SortPopoverPrimitive
                        portal={false}
                        sorts={sorts}
                        onApplySorts={onApplySorts}
                      />
                    </DndProvider>
                  </div>

                  <div className="flex items-center gap-x-3 divide-x">
                    <Pagination
                      page={page}
                      setPage={setPage}
                      rowsPerPage={rowsPerPage}
                      currentPageRowsCount={data?.rows.length ?? 0}
                      isLoading={isRefetching}
                    />
                    {isNullable && (
                      <div className="pl-3">
                        <Button
                          type="default"
                          onClick={() => {
                            if (columns?.length === 1) onSelect({ [columns[0].source]: null })
                          }}
                        >
                          Set NULL
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {data.rows.length > 0 ? (
                  <SelectorGrid
                    rows={data.rows}
                    onRowSelect={(row) => {
                      const value = columns?.reduce((a, b) => {
                        const targetColumn = selectedTable?.columns.find((x) => x.name === b.target)
                        const value =
                          targetColumn?.format === 'bytea'
                            ? convertByteaToHex(row[b.target])
                            : row[b.target]
                        return { ...a, [b.source]: value }
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
            </TableEditorTableStateContextProvider>
          )}
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default ForeignRowSelector
