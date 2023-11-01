import { CalculatedColumn } from 'react-data-grid'
import { GridProps, SavedState, SupaTable } from '../../types'
import { REFRESH_PAGE_IMMEDIATELY, TOTAL_ROWS_RESET } from '../../constants'
import { IRowService, SqlRowService } from '../../services/row'

export interface BaseInitialState {
  table: SupaTable | null
  rowService: IRowService | null
  refreshPageFlag: number
  isInitialComplete: boolean
  editable: boolean
  allRowsSelected: boolean
}

export const baseInitialState: BaseInitialState = {
  table: null,
  rowService: null,
  refreshPageFlag: 0,
  isInitialComplete: false,
  editable: false,
  allRowsSelected: false,
}

export type INIT_ACTIONTYPE =
  | {
      type: 'INIT_TABLE'
      payload: {
        table: SupaTable
        gridColumns: CalculatedColumn<any, any>[]
        gridProps?: GridProps
        savedState?: SavedState
        editable?: boolean
        onSqlQuery: (query: string) => Promise<{ data?: any; error?: any }>
        onError: (error: any) => void
      }
    }
  | {
      type: 'UPDATE_FILTERS'
      payload: {}
    }
  | {
      type: 'UPDATE_SORTS'
      payload: {}
    }

type BASE_ACTIONTYPE = INIT_ACTIONTYPE

const BaseReducer = (state: BaseInitialState, action: BASE_ACTIONTYPE) => {
  switch (action.type) {
    case 'INIT_TABLE': {
      return {
        ...state,
        table: action.payload.table,
        rowService: new SqlRowService(
          action.payload.table,
          action.payload.onSqlQuery,
          action.payload.onError
        ),
        refreshPageFlag: REFRESH_PAGE_IMMEDIATELY,
        isInitialComplete: true,
        editable: action.payload.editable || false,
      }
    }
    // [Joshen] Just FYI I'm doing refresh immediately as I don't see
    // why we need to debounce fetching of the page data (ref SupabaseGrid.tsx)
    // Leaving it as a comment here in case i'm overlooking something
    // If all is good, [TODO] Deprecate refreshPageDebounced
    case 'UPDATE_FILTERS': {
      const newState: any = { ...state }
      newState.page = 1
      // newState.refreshPageFlag = Date.now()
      newState.refreshPageFlag = REFRESH_PAGE_IMMEDIATELY
      newState.totalRows = TOTAL_ROWS_RESET
      return newState
    }
    case 'UPDATE_SORTS': {
      const newState: any = { ...state }
      // newState.refreshPageFlag = Date.now()
      newState.refreshPageFlag = REFRESH_PAGE_IMMEDIATELY
      return newState
    }
    default:
      return state
  }
}

export default BaseReducer
