import { FC, useState, useEffect } from 'react'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { Button, InputNumber, IconArrowRight, IconArrowLeft, IconLoader } from '@supabase/ui'
import { DropdownControl } from '../../common'
import { useDispatch, useTrackedState } from '../../../store'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

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

type PaginationProps = {}

const Pagination: FC<PaginationProps> = () => {
  const state = useTrackedState()
  const dispatch = useDispatch()
  const [page, setPage] = useState<number | null>(state.page)
  const maxPages = Math.ceil(state.totalRows / state.rowsPerPage)
  const totalPages = state.totalRows > 0 ? maxPages : 1

  // [Joshen] Oddly without this, state.selectedRows will be stale
  useEffect(() => {}, [state.selectedRows])

  // [Joshen] Note: I've made pagination buttons disabled while rows are being fetched for now
  // at least until we can send an abort signal to cancel requests if users are mashing the
  // pagination buttons to find the data they want

  const onPreviousPage = () => {
    if (state.page > 1) {
      if (state.selectedRows.size >= 1) {
        confirmAlert({
          title: 'Confirm moving to previous page',
          message: 'The currently selected lines will be deselected, do you want to proceed?',
          onConfirm: () => {
            goToPreviousPage()
            dispatch({
              type: 'SELECTED_ROWS_CHANGE',
              payload: { selectedRows: new Set() },
            })
          },
        })
      } else {
        goToPreviousPage()
      }
    }
  }

  const onNextPage = () => {
    if (state.page < maxPages) {
      if (state.selectedRows.size >= 1) {
        confirmAlert({
          title: 'Confirm moving to next page',
          message: 'The currently selected lines will be deselected, do you want to proceed?',
          onConfirm: () => {
            goToNextPage()
            dispatch({
              type: 'SELECTED_ROWS_CHANGE',
              payload: { selectedRows: new Set() },
            })
          },
        })
      } else {
        goToNextPage()
      }
    }
  }

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
      {state.totalRows < 0 ? (
        <p className="text-scale-1100 text-sm">Loading records...</p>
      ) : (
        <>
          <Button
            icon={<IconArrowLeft />}
            type="outline"
            disabled={state.page <= 1 || state.isLoading}
            onClick={onPreviousPage}
            style={{ padding: '3px 10px' }}
          />
          <p className="text-scale-1100 text-sm">Page</p>
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
          <p className="text-scale-1100 text-sm">{`of ${totalPages}`}</p>
          <Button
            icon={<IconArrowRight />}
            type="outline"
            disabled={state.page >= maxPages || state.isLoading}
            onClick={onNextPage}
            style={{ padding: '3px 10px' }}
          />

          <DropdownControl
            options={rowsPerPageOptions}
            onSelect={onRowsPerPageChange}
            side="top"
            align="start"
          >
            <Button
              as="span"
              type="outline"
              style={{ padding: '3px 10px' }}
            >{`${state.rowsPerPage} rows`}</Button>
          </DropdownControl>
          <p className="text-scale-1100 text-sm">{`${state.totalRows.toLocaleString()} ${
            state.totalRows === 0 || state.totalRows > 1 ? `records` : 'record'
          }`}</p>
          {state.isLoading && <IconLoader size={14} className="animate-spin" />}
        </>
      )}
    </div>
  )
}
export default Pagination
