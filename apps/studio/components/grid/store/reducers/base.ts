import { CalculatedColumn } from 'react-data-grid'
import { TOTAL_ROWS_RESET } from '../../constants'
import type { GridProps, SavedState, SupaTable } from '../../types'

export interface BaseInitialState {
  table: SupaTable | null
  isInitialComplete: boolean
  editable: boolean
}

export const baseInitialState: BaseInitialState = {
  table: null,
  isInitialComplete: false,
  editable: false,
}

export type INIT_ACTIONTYPE = {
  type: 'INIT_TABLE'
  payload: {
    table: SupaTable
    gridColumns: CalculatedColumn<any, any>[]
    gridProps?: GridProps
    savedState?: SavedState
    editable?: boolean
    onError: (error: any) => void
  }
}

type BASE_ACTIONTYPE = INIT_ACTIONTYPE

const BaseReducer = (state: BaseInitialState, action: BASE_ACTIONTYPE) => {
  switch (action.type) {
    case 'INIT_TABLE': {
      return {
        ...state,
        table: action.payload.table,
        isInitialComplete: true,
        editable: action.payload.editable || false,
      }
    }
    default:
      return state
  }
}

export default BaseReducer
