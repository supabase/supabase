import { ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTable } from 'data/table-editor/table-editor-types'
import { THRESHOLD_COUNT, useTableRowsCountQuery } from 'data/table-rows/table-rows-count-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { RoleImpersonationState } from 'lib/role-impersonation'
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

const Pagination = () => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined

  const { data: project } = useSelectedProjectQuery()
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()

  const { data: selectedTable } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  // rowsCountEstimate is only applicable to table entities
  const rowsCountEstimate = isTable(selectedTable) ? selectedTable.live_rows_estimate : null

  const { filters } = useTableFilter()
  const page = snap.page

  const roleImpersonationState = useRoleImpersonationStateSnapshot()
  const [isConfirmNextModalOpen, setIsConfirmNextModalOpen] = useState(false)
  const [isConfirmPreviousModalOpen, setIsConfirmPreviousModalOpen] = useState(false)
  const [isConfirmFetchExactCountModalOpen, setIsConfirmFetchExactCountModalOpen] = useState(false)

  const [value, setValue] = useState<string>(page.toString())

  // keep input value in-sync with actual page
  useEffect(() => {
    setValue(String(page))
  }, [page])

  const { data, isLoading, isSuccess, isError, isFetching, error } = useTableRowsCountQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      tableId: snap.table.id,
      filters,
      enforceExactCount: snap.enforceExactCount,
      roleImpersonationState: roleImpersonationState as RoleImpersonationState,
    },
    {
      keepPreviousData: true,
    }
  )

  const count = data?.count ?? 0
  const countString = data?.is_estimate ? formatEstimatedCount(count) : count.toLocaleString()
  const maxPages = Math.ceil(count / tableEditorSnap.rowsPerPage)
  const totalPages = count > 0 ? maxPages : 1

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

  useEffect(() => {
    if (page && page > totalPages) {
      snap.setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    if (id !== undefined) {
      snap.setEnforceExactCount(rowsCountEstimate !== null && rowsCountEstimate <= THRESHOLD_COUNT)
    }
  }, [id])

  useEffect(() => {
    // If the count query encountered a timeout error with exact count
    // turn off the exact count to rely on approximate
    if (isError && snap.enforceExactCount && error?.code === 408) {
      snap.setEnforceExactCount(false)
    }
  }, [isError, snap.enforceExactCount, error?.code])

  return (
    <div className="flex items-center gap-x-4">
      {isLoading && <p className="text-sm text-foreground-light">Loading records count...</p>}

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
          </div>

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
export default Pagination
