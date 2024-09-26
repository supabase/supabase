import { ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PostgresTable } from '@supabase/postgres-meta'

import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { THRESHOLD_COUNT, useTableRowsCountQuery } from 'data/table-rows/table-rows-count-query'
import useTable from 'hooks/misc/useTable'
import { useUrlState } from 'hooks/ui/useUrlState'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import {
  Button,
  InputNumber,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useParams } from 'common'
import { useDispatch, useTrackedState } from '../../../store/Store'
import { DropdownControl } from '../../common/DropdownControl'
import { formatEstimatedCount } from './Pagination.utils'
import { Input } from 'ui-patterns/DataInputs/Input'

const rowsPerPageOptions = [
  { value: 100, label: '100 rows' },
  { value: 500, label: '500 rows' },
  { value: 1000, label: '1000 rows' },
]

const Pagination = () => {
  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined

  const state = useTrackedState()
  const dispatch = useDispatch()
  const { project } = useProjectContext()
  const snap = useTableEditorStateSnapshot()

  const { data: selectedTable } = useTable(id)
  // [Joshen] Only applicable to table entities
  const rowsCountEstimate = (selectedTable as PostgresTable)?.live_rows_estimate ?? null

  const [{ filter }] = useUrlState({ arrayKeys: ['filter'] })
  const filters = formatFilterURLParams(filter as string[])
  const page = snap.page
  const table = state.table ?? undefined

  const roleImpersonationState = useRoleImpersonationStateSnapshot()
  const [isConfirmNextModalOpen, setIsConfirmNextModalOpen] = useState(false)
  const [isConfirmPreviousModalOpen, setIsConfirmPreviousModalOpen] = useState(false)
  const [isConfirmFetchExactCountModalOpen, setIsConfirmFetchExactCountModalOpen] = useState(false)

  const [value, setValue] = useState<string>(page.toString())

  // keep input value in-sync with actual page
  useEffect(() => {
    setValue(String(page))
  }, [page])

  const { data, isLoading, isSuccess, isError, isFetching } = useTableRowsCountQuery(
    {
      queryKey: [table?.schema, table?.name, 'count-estimate'],
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      table,
      filters,
      enforceExactCount: snap.enforceExactCount,
      impersonatedRole: roleImpersonationState.role,
    },
    {
      keepPreviousData: true,
      onSuccess(data) {
        dispatch({
          type: 'SET_ROWS_COUNT',
          payload: data.count,
        })
      },
    }
  )

  const count = data?.is_estimate ? formatEstimatedCount(data.count) : data?.count.toLocaleString()
  const maxPages = Math.ceil((data?.count ?? 0) / snap.rowsPerPage)
  const totalPages = (data?.count ?? 0) > 0 ? maxPages : 1

  const onPreviousPage = () => {
    if (page > 1) {
      if (state.selectedRows.size >= 1) {
        setIsConfirmPreviousModalOpen(true)
      } else {
        goToPreviousPage()
      }
    }
  }

  const onConfirmPreviousPage = () => {
    goToPreviousPage()
    dispatch({
      type: 'SELECTED_ROWS_CHANGE',
      payload: { selectedRows: new Set() },
    })
  }

  const onNextPage = () => {
    if (page < maxPages) {
      if (state.selectedRows.size >= 1) {
        setIsConfirmNextModalOpen(true)
      } else {
        goToNextPage()
      }
    }
  }

  const onConfirmNextPage = () => {
    goToNextPage()
    dispatch({
      type: 'SELECTED_ROWS_CHANGE',
      payload: { selectedRows: new Set() },
    })
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
    snap.setRowsPerPage(isNaN(rowsPerPage) ? 100 : rowsPerPage)
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

  return (
    <div className="flex items-center gap-x-4">
      {isLoading && <p className="text-sm text-foreground-light">Loading records count...</p>}

      {isSuccess && (
        <>
          <div className="flex items-center gap-x-2">
            <Button
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
                  e.code === 'Enter' &&
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
                <span>{`${snap.rowsPerPage} rows`}</span>
              </Button>
            </DropdownControl>
          </div>

          <div className="flex items-center gap-x-2">
            <p className="text-xs text-foreground-light">
              {`${count} ${data.count === 0 || data.count > 1 ? `records` : 'record'}`}{' '}
              {data.is_estimate ? '(estimated)' : ''}
            </p>

            {data.is_estimate && (
              <Tooltip_Shadcn_>
                <TooltipTrigger_Shadcn_ asChild>
                  <Button
                    size="tiny"
                    type="text"
                    className="px-1.5"
                    loading={isFetching}
                    icon={<HelpCircle />}
                    onClick={() => {
                      // Show warning if either NOT a table entity, or table rows estimate is beyond threshold
                      if (rowsCountEstimate === null || data.count > THRESHOLD_COUNT) {
                        setIsConfirmFetchExactCountModalOpen(true)
                      } else snap.setEnforceExactCount(true)
                    }}
                  />
                </TooltipTrigger_Shadcn_>
                <TooltipContent_Shadcn_ side="top" className="w-72">
                  This is an estimated value as your table has more than{' '}
                  {THRESHOLD_COUNT.toLocaleString()} rows. <br />
                  <span className="text-brand">
                    Click to retrieve the exact count of the table.
                  </span>
                </TooltipContent_Shadcn_>
              </Tooltip_Shadcn_>
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
