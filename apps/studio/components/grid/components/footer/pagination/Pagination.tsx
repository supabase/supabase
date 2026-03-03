import { THRESHOLD_COUNT } from '@supabase/pg-meta/src/sql/studio/get-count-estimate'
import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import { useTableSort } from 'components/grid/hooks/useTableSort'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isForeignTable, isTable } from 'data/table-editor/table-editor-types'
import { useTableRowsCountQuery } from 'data/table-rows/table-rows-count-query'
import { useTableRowsQuery } from 'data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { RoleImpersonationState } from 'lib/role-impersonation'
import { ArrowLeft, ArrowRight, HelpCircle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { DropdownControl } from '../../common/DropdownControl'
import { formatEstimatedCount } from './Pagination.utils'

const rowsPerPageOptions = [
  { value: 100, label: '100 rows' },
  { value: 500, label: '500 rows' },
  { value: 1000, label: '1000 rows' },
]

const RowCountSelector = ({
  onRowsPerPageChange,
}: {
  onRowsPerPageChange: (value: number | string) => void
}) => {
  const tableEditorSnap = useTableEditorStateSnapshot()

  return (
    <DropdownControl
      options={rowsPerPageOptions}
      onSelect={onRowsPerPageChange}
      side="top"
      align="start"
    >
      <Button asChild type="outline" style={{ padding: '3px 10px' }}>
        <span>{`${tableEditorSnap.rowsPerPage} rows`}</span>
      </Button>
    </DropdownControl>
  )
}

type PaginationProps = {
  enableForeignRowsQuery?: boolean
}

export const Pagination = ({ enableForeignRowsQuery = true }: PaginationProps) => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined

  const { sorts } = useTableSort()
  const { filters } = useTableFilter()

  const { data: project } = useSelectedProjectQuery()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()
  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  const { data: selectedTable } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })
  const isForeignTableSelected = isForeignTable(selectedTable)

  const page = snap.page
  // rowsCountEstimate is only applicable to table entities
  const rowsCountEstimate = isTable(selectedTable) ? selectedTable.live_rows_estimate : null

  const [value, setValue] = useState<string>(page.toString())
  const [isConfirmNextModalOpen, setIsConfirmNextModalOpen] = useState(false)
  const [isConfirmPreviousModalOpen, setIsConfirmPreviousModalOpen] = useState(false)
  const [isConfirmFetchExactCountModalOpen, setIsConfirmFetchExactCountModalOpen] = useState(false)

  const {
    data,
    isPending: isLoading,
    isSuccess,
    isError,
    isFetching,
    error,
  } = useTableRowsCountQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      tableId: snap.table.id,
      filters,
      enforceExactCount: snap.enforceExactCount,
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    {
      placeholderData: keepPreviousData,
      enabled: !isForeignTableSelected,
    }
  )
  const count = data?.count ?? 0
  const countString = data?.is_estimate ? formatEstimatedCount(count) : count.toLocaleString()
  const maxPages = Math.ceil(count / tableEditorSnap.rowsPerPage)
  const totalPages = count > 0 ? maxPages : 1

  const preflightCheck = !tableEditorSnap.tablesToIgnorePreflightCheck.includes(id ?? -1)

  // [Joshen] This is only applicable for foreign tables, as we use the number of rows on the page to determine
  // if we've reached the last page (and hence disable the next button)
  const { data: rowsData, isPending: isLoadingRows } = useTableRowsQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      tableId: id,
      sorts,
      filters,
      page: snap.page,
      preflightCheck,
      limit: tableEditorSnap.rowsPerPage,
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    {
      enabled: isForeignTableSelected && enableForeignRowsQuery,
    }
  )
  const isLastPage = (rowsData?.rows ?? []).length < tableEditorSnap.rowsPerPage

  const onPreviousPage = () => {
    if (page > 1) {
      if (snap.selectedRows.size >= 1) {
        setIsConfirmPreviousModalOpen(true)
      } else {
        goToPreviousPage()
      }
    }
  }

  const onConfirmPreviousPage = () => {
    goToPreviousPage()
    setIsConfirmPreviousModalOpen(false)
  }

  const onNextPage = () => {
    if (page < maxPages) {
      if (snap.selectedRows.size >= 1) {
        setIsConfirmNextModalOpen(true)
      } else {
        goToNextPage()
      }
    }
  }

  const onConfirmNextPage = () => {
    goToNextPage()
    setIsConfirmNextModalOpen(false)
  }

  const goToPreviousPage = () => {
    const previousPage = page - 1
    snap.setPage(previousPage)
  }

  const goToNextPage = () => {
    const nextPage = page + 1
    snap.setPage(nextPage)
  }

  const onPageChange = (page: number) => {
    const pageNum = page > maxPages ? maxPages : page
    snap.setPage(pageNum || 1)
  }

  const onRowsPerPageChange = (value: string | number) => {
    const rowsPerPage = Number(value)
    tableEditorSnap.setRowsPerPage(isNaN(rowsPerPage) ? 100 : rowsPerPage)
  }

  // keep input value in-sync with actual page
  useEffect(() => {
    setValue(String(page))
  }, [page])

  useEffect(() => {
    if (!isForeignTableSelected && page && page > totalPages) {
      snap.setPage(totalPages)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isForeignTableSelected, page, totalPages])

  useEffect(() => {
    if (id !== undefined) {
      snap.setEnforceExactCount(rowsCountEstimate !== null && rowsCountEstimate <= THRESHOLD_COUNT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    // If the count query encountered a timeout error with exact count
    // turn off the exact count to rely on approximate
    if (isError && snap.enforceExactCount && error?.code === 408) {
      snap.setEnforceExactCount(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError, snap.enforceExactCount, error?.code])

  if (isForeignTableSelected) {
    return (
      <div className="flex items-center gap-x-2">
        <Button
          aria-label="Previous page"
          icon={<ArrowLeft />}
          type="outline"
          className="px-1.5"
          disabled={page <= 1}
          onClick={onPreviousPage}
        />
        <p className="text-xs text-foreground-light">Page</p>
        <Input
          size="tiny"
          className="w-10"
          min={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            const parsedValue = Number(value)
            if (
              (e.code === 'Enter' || e.code === 'NumpadEnter') &&
              !Number.isNaN(parsedValue) &&
              parsedValue >= 1
            ) {
              onPageChange(parsedValue)
            }
          }}
        />
        <Button
          aria-label="Next page"
          icon={<ArrowRight />}
          type="outline"
          className="px-1.5"
          disabled={isLastPage || !enableForeignRowsQuery}
          loading={isLoadingRows && enableForeignRowsQuery}
          onClick={goToNextPage}
        />
        <RowCountSelector onRowsPerPageChange={onRowsPerPageChange} />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-x-4">
      {isLoading && (
        <div className="flex items-center gap-x-2">
          <Loader2 size={12} className="animate-spin" />
          <p className="text-xs text-foreground-light">Loading records count...</p>
        </div>
      )}

      {isSuccess && (
        <>
          <div className="flex items-center gap-x-2">
            <Button
              aria-label="Previous page"
              icon={<ArrowLeft />}
              type="outline"
              className="px-1.5"
              disabled={page <= 1 || isLoading}
              onClick={onPreviousPage}
            />
            <p className="text-xs text-foreground-light">Page</p>
            <Input
              className="w-12"
              size="tiny"
              min={1}
              max={maxPages}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                const parsedValue = Number(value)
                if (
                  (e.code === 'Enter' || e.code === 'NumpadEnter') &&
                  !Number.isNaN(parsedValue) &&
                  parsedValue >= 1 &&
                  parsedValue <= maxPages
                ) {
                  onPageChange(parsedValue)
                }
              }}
            />

            <p className="text-xs text-foreground-light">of {totalPages.toLocaleString()}</p>

            <Button
              aria-label="Next page"
              icon={<ArrowRight />}
              type="outline"
              className="px-1.5"
              disabled={page >= maxPages || isLoading}
              onClick={onNextPage}
            />

            <RowCountSelector onRowsPerPageChange={onRowsPerPageChange} />
          </div>

          {!isForeignTableSelected && (
            <div className="flex items-center gap-x-2">
              <p className="text-xs text-foreground-light">
                {`${countString} ${count === 0 || count > 1 ? `records` : 'record'}`}{' '}
                {data.is_estimate ? '(estimated)' : ''}
              </p>

              {data.is_estimate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="tiny"
                      type="text"
                      className="px-1.5"
                      loading={isFetching}
                      icon={<HelpCircle />}
                      onClick={() => {
                        // Show warning if either NOT a table entity, or table rows estimate is beyond threshold
                        if (rowsCountEstimate === null || count > THRESHOLD_COUNT) {
                          setIsConfirmFetchExactCountModalOpen(true)
                        } else snap.setEnforceExactCount(true)
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="w-72">
                    This is an estimated value as your table has more than{' '}
                    {THRESHOLD_COUNT.toLocaleString()} rows. <br />
                    <span className="text-brand">
                      Click to retrieve the exact count of the table.
                    </span>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </>
      )}

      {isError && (
        <p className="text-sm text-foreground-light">
          Error fetching records count. Please refresh the page.
        </p>
      )}

      <ConfirmationModal
        visible={isConfirmPreviousModalOpen}
        title="Confirm moving to previous page"
        confirmLabel="Confirm"
        onCancel={() => setIsConfirmPreviousModalOpen(false)}
        onConfirm={() => {
          onConfirmPreviousPage()
        }}
      >
        <p className="text-sm text-foreground-light">
          The currently selected lines will be deselected, do you want to proceed?
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        visible={isConfirmNextModalOpen}
        title="Confirm moving to next page"
        confirmLabel="Confirm"
        onCancel={() => setIsConfirmNextModalOpen(false)}
        onConfirm={() => {
          onConfirmNextPage()
        }}
      >
        <p className="text-sm text-foreground-light">
          The currently selected lines will be deselected, do you want to proceed?
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        variant="warning"
        visible={isConfirmFetchExactCountModalOpen}
        title="Confirm to fetch exact count for table"
        confirmLabel="Retrieve exact count"
        onCancel={() => setIsConfirmFetchExactCountModalOpen(false)}
        onConfirm={() => {
          snap.setEnforceExactCount(true)
          setIsConfirmFetchExactCountModalOpen(false)
        }}
      >
        <p className="text-sm text-foreground-light">
          {rowsCountEstimate === null
            ? `If your table has a row count of greater than ${THRESHOLD_COUNT.toLocaleString()} rows,
          retrieving the exact count of the table may cause performance issues on your database.`
            : `Your table has a row count of greater than ${THRESHOLD_COUNT.toLocaleString()} rows, and
          retrieving the exact count of the table may cause performance issues on your database.`}
        </p>
      </ConfirmationModal>
    </div>
  )
}
