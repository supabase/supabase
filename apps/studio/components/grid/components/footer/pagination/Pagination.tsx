import { useEffect, useState } from 'react'

import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useTableRowsCountQuery } from 'data/table-rows/table-rows-count-query'
import { useUrlState } from 'hooks'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { Button, IconArrowLeft, IconArrowRight, IconLoader, InputNumber, Modal } from 'ui'
import { useDispatch, useTrackedState } from '../../../store'
import { DropdownControl } from '../../common'
import { useTableEditorStateSnapshot } from 'state/table-editor'

const rowsPerPageOptions = [
  { value: 100, label: '100 rows' },
  { value: 500, label: '500 rows' },
  { value: 1000, label: '1000 rows' },
]

export interface PaginationProps {
  isLoading?: boolean
}

const Pagination = ({ isLoading: isLoadingRows = false }: PaginationProps) => {
  const state = useTrackedState()
  const dispatch = useDispatch()

  const snap = useTableEditorStateSnapshot()
  const page = snap.page

  const [{ filter }] = useUrlState({
    arrayKeys: ['filter'],
  })
  const filters = formatFilterURLParams(filter as string[])
  const table = state.table ?? undefined

  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  const { project } = useProjectContext()
  const { data, isLoading, isSuccess, isError } = useTableRowsCountQuery(
    {
      queryKey: [table?.schema, table?.name, 'count'],
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      table,
      filters,
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

  const maxPages = Math.ceil((data?.count ?? 0) / snap.rowsPerPage)
  const totalPages = (data?.count ?? 0) > 0 ? maxPages : 1

  useEffect(() => {
    if (page && page > totalPages) {
      snap.setPage(totalPages)
    }
  }, [page, totalPages])

  // [Joshen] Oddly without this, state.selectedRows will be stale
  useEffect(() => {}, [state.selectedRows])

  // [Joshen] Note: I've made pagination buttons disabled while rows are being fetched for now
  // at least until we can send an abort signal to cancel requests if users are mashing the
  // pagination buttons to find the data they want

  const [isConfirmPreviousModalOpen, setIsConfirmPreviousModalOpen] = useState(false)

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

  const [isConfirmNextModalOpen, setIsConfirmNextModalOpen] = useState(false)

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

  // TODO: look at aborting useTableRowsQuery if the user presses the button quickly

  const goToPreviousPage = () => {
    const previousPage = page - 1
    snap.setPage(previousPage)
  }

  const goToNextPage = () => {
    const nextPage = page + 1
    snap.setPage(nextPage)
  }

  function onPageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    const pageNum = Number(value) > maxPages ? maxPages : Number(value)
    snap.setPage(pageNum || 1)
  }

  function onRowsPerPageChange(value: string | number) {
    const rowsPerPage = Number(value)

    snap.setRowsPerPage(isNaN(rowsPerPage) ? 100 : rowsPerPage)
  }

  return (
    <div className="sb-grid-pagination">
      {isLoading && <p className="text-sm text-foreground-light">Loading records count...</p>}

      {isSuccess && (
        <>
          <Button
            icon={<IconArrowLeft />}
            type="outline"
            disabled={page <= 1 || isLoading}
            onClick={onPreviousPage}
            style={{ padding: '3px 10px' }}
          />
          <p className="text-sm text-foreground-light">Page</p>
          <div className="sb-grid-pagination-input-container">
            <InputNumber
              // [Fran] we'll have to upgrade the UI component types to accept the null value when users delete the input content
              // @ts-ignore
              value={page}
              onChange={onPageChange}
              size="tiny"
              style={{
                width: '3rem',
              }}
              max={maxPages}
              min={1}
            />
          </div>
          <p className="text-sm text-foreground-light">{`of ${totalPages}`}</p>
          <Button
            icon={<IconArrowRight />}
            type="outline"
            disabled={page >= maxPages || isLoading}
            onClick={onNextPage}
            style={{ padding: '3px 10px' }}
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
          <p className="text-sm text-foreground-light">{`${data.count.toLocaleString()} ${
            data.count === 0 || data.count > 1 ? `records` : 'record'
          }`}</p>

          <ConfirmationModal
            visible={isConfirmPreviousModalOpen}
            title="Confirm moving to previous page"
            confirmLabel="Confirm"
            onCancel={() => setIsConfirmPreviousModalOpen(false)}
            onConfirm={() => {
              onConfirmPreviousPage()
            }}
          >
            <p className="py-4 text-sm text-foreground-light">
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
            <p className="py-4 text-sm text-foreground-light">
              The currently selected lines will be deselected, do you want to proceed?
            </p>
          </ConfirmationModal>
        </>
      )}

      {isError && (
        <p className="text-sm text-foreground-light">
          Error fetching records count. Please refresh the page.
        </p>
      )}
    </div>
  )
}
export default Pagination
