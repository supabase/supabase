import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { InitialStateType } from '../store/reducers'
import { formatSortURLParams, formatFilterURLParams } from '../SupabaseGrid.utils'

export async function fetchCount(
  state: InitialStateType,
  dispatch: (value: unknown) => void,
  filter?: string[] // Come directly from URL param
) {
  if (!state.rowService) return

  const filters = formatFilterURLParams(filter)
  const { data, error } = await state.rowService.count(filters)
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
  sort?: string[], // Come directly from URL param
  filter?: string[] // Come directly from URL param
) {
  if (!state.rowService) return
  dispatch({ type: 'SET_IS_LOADING', payload: { isLoading: true } })

  const sorts = formatSortURLParams(sort)
  const filters = formatFilterURLParams(filter)
  const { data, error } = await state.rowService.fetchPage(
    state.page,
    state.rowsPerPage,
    filters,
    sorts
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
