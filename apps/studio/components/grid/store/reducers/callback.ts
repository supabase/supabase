import type { SupaRow } from '../../types'

export interface CallbackInitialState {
  onAddColumn: (() => void) | null
  onAddRow: (() => void) | null
  onError: ((error: any) => void) | null
  onEditRow: ((row: SupaRow) => void) | null
  onEditColumn: ((columnName: string) => void) | null
  onDeleteColumn: ((columnName: string) => void) | null
}

export const callbackInitialState: CallbackInitialState = {
  onAddColumn: null,
  onAddRow: null,
  onError: null,
  onEditRow: null,
  onEditColumn: null,
  onDeleteColumn: null,
}

type CALLBACK_ACTIONTYPE = {
  type: 'INIT_CALLBACK'
  payload: {
    onAddColumn: (() => void) | null
    onAddRow: (() => void) | null
    onError: ((error: any) => void) | null
    onEditRow: ((row: SupaRow) => void) | null
    onEditColumn: ((columnName: string) => void) | null
    onDeleteColumn: ((columnName: string) => void) | null
  }
}

const CallbackReducer = (state: CallbackInitialState, action: CALLBACK_ACTIONTYPE) => {
  switch (action.type) {
    case 'INIT_CALLBACK': {
      return {
        ...state,
        onAddColumn: action.payload.onAddColumn,
        onAddRow: action.payload.onAddRow,
        onError: action.payload.onError,
        onEditRow: action.payload.onEditRow,
        onEditColumn: action.payload.onEditColumn,
        onDeleteColumn: action.payload.onDeleteColumn,
      }
    }

    default:
      return state
  }
}

export default CallbackReducer
