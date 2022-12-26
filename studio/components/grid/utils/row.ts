import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { InitialStateType } from '../store/reducers'
import { Sort, Filter } from '../types'

export async function fetchCount(
  state: InitialStateType,
  dispatch: (value: unknown) => void,
  filters: Filter[]
) {
  if (!state.rowService) return

  // Remove unavailable columns from filters
  const columnNames = state.table?.columns.map((column) => column.name) ?? []
  const cleanedFilters = filters.filter((filter) => columnNames.includes(filter.column))

  const { data, error } = await state.rowService.count(cleanedFilters)
  if (error) {
    // TODO: handle fetch rows count error
  } else {
    dispatch({
      type: 'SET_ROWS_COUNT',
      payload: data ?? 0,
    })
  }
}

export async function fetchPage(
  state: InitialStateType,
  dispatch: (value: unknown) => void,
  sorts: Sort[],
  filters: Filter[]
) {
  if (!state.rowService) {
    return dispatch({
      type: 'SET_ROWS',
      payload: { rows: state?.rows ?? [] },
    })
  }

  dispatch({ type: 'SET_IS_LOADING', payload: { isLoading: true } })

  // Remove unavailable columns from sorts & filter
  const columnNames = state.table?.columns.map((column) => column.name) ?? []
  const cleanedFilters = filters.filter((filter) => columnNames.includes(filter.column))
  const cleanedSorts = sorts.filter((sort) => columnNames.includes(sort.column))

  const { data, error } = await state.rowService.fetchPage(
    state.page,
    state.rowsPerPage,
    cleanedFilters,
    cleanedSorts
  )
  if (error) {
    // TODO: handle fetch rows data error
  } else {
    dispatch({
      type: 'SET_ROWS',
      payload: { rows: data?.rows ?? [] },
    })
  }
  dispatch({ type: 'SET_IS_LOADING', payload: { isLoading: false } })
}
export const refreshPageDebounced = AwesomeDebouncePromise(fetchPage, 500)
