import { useEffect, useState } from 'react'

import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ConfirmationModal from 'components/ui/ConfirmationModal'
import { useTableRowsCountQuery } from 'data/table-rows/table-rows-count-query'
import { useUrlState } from 'hooks'
import { Button, IconArrowLeft, IconArrowRight, IconLoader, InputNumber, Modal } from 'ui'
import { useDispatch, useTrackedState } from '../../../store'
import { DropdownControl } from '../../common'

const updatePage = (payload: number, dispatch: (value: unknown) => void) => {
  dispatch({
    type: 'SET_PAGE',
    payload: payload,
  })
}
const updatePageDebounced = AwesomeDebouncePromise(updatePage, 550)

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
  const [page, setPage] = useState<number | null>(state.page)

  const [{ filter }] = useUrlState({
    arrayKeys: ['filter'],
  })
  const filters = formatFilterURLParams(filter as string[])
  const table = state.table ?? undefined
  const { project } = useProjectContext()
  const { data, isLoading, isSuccess, isError } = useTableRowsCountQuery(
    {
      queryKey: [table?.schema, table?.name, 'count'],
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      table,
      filters,
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

  const maxPages = Math.ceil((data?.count ?? 0) / state.rowsPerPage)
  const totalPages = (data?.count ?? 0) > 0 ? maxPages : 1

  useEffect(() => {
    if (page && page > totalPages) {
      setPage(totalPages)
      dispatch({ type: 'SET_PAGE', payload: totalPages })
    }
  }, [page, totalPages])

  // [Joshen] Oddly without this, state.selectedRows will be stale
  useEffect(() => {}, [state.selectedRows])

  // [Joshen] Note: I've made pagination buttons disabled while rows are being fetched for now
  // at least until we can send an abort signal to cancel requests if users are mashing the
  // pagination buttons to find the data they want

  const [isConfirmPreviousModalOpen, setIsConfirmPreviousModalOpen] = useState(false)

  const onPreviousPage = () => {
    if (state.page > 1) {
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
    if (state.page < maxPages) {
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
    const previousPage = state.page - 1
    setPage(previousPage)
    dispatch({ type: 'SET_PAGE', payload: previousPage })
  }

  const goToNextPage = () => {
    const nextPage = state.page + 1
    setPage(nextPage)
    dispatch({ type: 'SET_PAGE', payload: nextPage })
  }

  function onPageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    const pageNum = Number(value) > maxPages ? maxPages : Number(value)
    setPage(pageNum || null)
    if (pageNum) {
      updatePageDebounced(pageNum, dispatch)
    }
  }

  function onRowsPerPageChange(value: string | number) {
    dispatch({ type: 'SET_ROWS_PER_PAGE', payload: value })
  }

  return (
    <div className="sb-grid-pagination">
      {isLoading && <p className="text-sm text-foreground-light">Loading records count...</p>}

      {isSuccess && (
        <>
          <Button
            icon={<IconArrowLeft />}
            type="outline"
            disabled={state.page <= 1 || isLoading}
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
            disabled={state.page >= maxPages || isLoading}
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
              <span>{`${state.rowsPerPage} rows`}</span>
            </Button>
          </DropdownControl>
          <p className="text-sm text-foreground-light">{`${data.count.toLocaleString()} ${
            data.count === 0 || data.count > 1 ? `records` : 'record'
          }`}</p>
          {isLoadingRows && <IconLoader size={14} className="animate-spin" />}

          <ConfirmationModal
            visible={isConfirmPreviousModalOpen}
            header="Confirm moving to previous page"
            buttonLabel="Confirm"
            onSelectCancel={() => setIsConfirmPreviousModalOpen(false)}
            onSelectConfirm={() => {
              onConfirmPreviousPage()
            }}
          >
            <Modal.Content>
              <p className="py-4 text-sm text-foreground-light">
                The currently selected lines will be deselected, do you want to proceed?
              </p>
            </Modal.Content>
          </ConfirmationModal>

          <ConfirmationModal
            visible={isConfirmNextModalOpen}
            header="Confirm moving to next page"
            buttonLabel="Confirm"
            onSelectCancel={() => setIsConfirmNextModalOpen(false)}
            onSelectConfirm={() => {
              onConfirmNextPage()
            }}
          >
            <Modal.Content>
              <p className="py-4 text-sm text-foreground-light">
                The currently selected lines will be deselected, do you want to proceed?
              </p>
            </Modal.Content>
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
