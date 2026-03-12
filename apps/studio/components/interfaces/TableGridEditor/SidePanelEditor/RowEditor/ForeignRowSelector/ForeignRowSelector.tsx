import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { FilterPopoverPrimitive } from 'components/grid/components/header/filter/FilterPopoverPrimitive'
import { RefreshButton } from 'components/grid/components/header/RefreshButton'
import { SortPopoverPrimitive } from 'components/grid/components/header/sort/SortPopoverPrimitive'
import {
  formatSortURLParams,
  loadTableEditorStateFromLocalStorage,
  saveTableEditorStateToLocalStorage,
  sortsToUrlParams,
} from 'components/grid/SupabaseGrid.utils'
import type { Filter, Sort } from 'components/grid/types'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import {
  RoleImpersonationState,
  useRoleImpersonationStateSnapshot,
} from 'state/role-impersonation-state'
import { TableEditorTableStateContextProvider } from 'state/table-editor-table'
import { Button, SidePanel } from 'ui'

import { ForeignKey } from '../../ForeignKeySelector/ForeignKeySelector.types'
import { convertByteaToHex } from '../RowEditor.utils'
import Pagination from './Pagination'
import SelectorGrid from './SelectorGrid'

const FOREIGN_ROW_SELECTOR_TABLE_NAME_SUFFIX = '__frselector'

export interface ForeignRowSelectorProps {
  visible: boolean
  foreignKey?: ForeignKey
  isSaving?: boolean
  onSelect: (value?: { [key: string]: any }) => void
  closePanel: () => void
}

export const ForeignRowSelector = ({
  visible,
  foreignKey,
  isSaving,
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

  const {
    data,
    isPending: isLoading,
    isSuccess,
    isError,
    isRefetching,
  } = useTableRowsQuery(
    {
      projectRef: project?.ref,
      tableId: table?.id,
      sorts,
      filters,
      page,
      limit: rowsPerPage,
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    {
      placeholderData: keepPreviousData,
    }
  )

  // Only start saving sorts after the previous sorts have been loaded
  const [shouldSaveSorts, setShouldSaveSorts] = useState(false)

  // Load sorts from local storage
  useEffect(() => {
    if (!project?.ref || !table?.name || !table?.schema) return

    try {
      const savedState = loadTableEditorStateFromLocalStorage(project.ref, table.id)
      const urlSorts = savedState?.sorts ?? []
      const parsedSorts = formatSortURLParams(table.name, urlSorts)
      if (parsedSorts.length > 0) {
        setFiltersAndSorts((prev) => ({ ...prev, sort: parsedSorts }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setShouldSaveSorts(true)
    }
  }, [project?.ref, table?.schema, table?.name, table?.id])

  // Persist sorts to local storage
  useEffect(() => {
    if (!project?.ref || !table?.id || !shouldSaveSorts) return
    try {
      const urlSorts = sortsToUrlParams(sorts)
      saveTableEditorStateToLocalStorage({
        projectRef: project.ref,
        tableId: table.id,
        sorts: urlSorts,
      })
    } catch (e) {
      console.error(e)
    }
  }, [shouldSaveSorts, sorts, project?.ref, table?.id])

  return (
    <SidePanel
      hideFooter
      visible={visible}
      size="large"
      header={
        <div className="flex items-center justify-between">
          <p>
            Select a record to reference from{' '}
            <code className="text-code-inline !text-sm">
              {schemaName}.{tableName}
            </code>
          </p>
          <div className="flex items-center gap-x-4">
            {isSaving && (
              <div className="flex items-center gap-x-2">
                <Loader2 className="animate-spin" size={12} />
                <p className="text-xs text-foreground-light">Saving</p>
              </div>
            )}
            <Button type="text" icon={<X />} className="w-7" onClick={closePanel} />
          </div>
        </div>
      }
      onCancel={closePanel}
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
                    <FilterPopoverPrimitive filters={filters} onApplyFilters={onApplyFilters} />
                    <DndProvider backend={HTML5Backend} context={window}>
                      <SortPopoverPrimitive sorts={sorts} onApplySorts={onApplySorts} />
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
                      if (!isSaving) {
                        const value = columns?.reduce((a, b) => {
                          const targetColumn = selectedTable?.columns.find(
                            (x) => x.name === b.target
                          )
                          const value =
                            targetColumn?.format === 'bytea'
                              ? convertByteaToHex(row[b.target])
                              : row[b.target]
                          return { ...a, [b.source]: value }
                        }, {})
                        onSelect(value)
                      }
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
