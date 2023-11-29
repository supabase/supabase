import update from 'immutability-helper'
import { TOTAL_ROWS_INITIAL, TOTAL_ROWS_RESET } from '../../constants'
import { Dictionary, SupaRow } from '../../types'
import { INIT_ACTIONTYPE } from './base'

export interface RowInitialState {
  rows: SupaRow[]
  selectedRows: ReadonlySet<number>
  selectedCellPosition: { idx: number; rowIdx: number } | null
  totalRows: number
}

export const rowInitialState: RowInitialState = {
  rows: [],
  selectedRows: new Set(),
  selectedCellPosition: null,
  totalRows: TOTAL_ROWS_INITIAL,
}

type ROW_ACTIONTYPE =
  | INIT_ACTIONTYPE
  | {
      type: 'SELECTED_CELL_CHANGE'
      payload: { position: { idx: number; rowIdx: number } }
    }
  | {
      type: 'SELECTED_ROWS_CHANGE'
      payload: { selectedRows: ReadonlySet<number> }
    }
  | {
      type: 'SET_ROWS'
      payload: { rows: SupaRow[] }
    }
  | {
      type: 'SET_ROWS_COUNT'
      payload: number
    }
  | { type: 'ADD_NEW_ROW'; payload: Dictionary<any> }
  | { type: 'EDIT_ROW'; payload: { row: Dictionary<any>; idx: number } }
  | { type: 'REMOVE_ROWS'; payload: { rowIdxs: number[] } }
  | { type: 'SELECT_ALL_ROWS'; payload: { selectedRows: ReadonlySet<number> } }

const RowReducer = (state: RowInitialState, action: ROW_ACTIONTYPE) => {
  switch (action.type) {
    case 'INIT_TABLE': {
      return {
        ...state,
        selectedCellPosition: null,
        selectedRows: new Set(),
        totalRows: TOTAL_ROWS_RESET,
      }
    }
    case 'SELECTED_CELL_CHANGE': {
      return {
        ...state,
        selectedCellPosition: action.payload.position,
      }
    }
    case 'SELECTED_ROWS_CHANGE': {
      return {
        ...state,
        allRowsSelected: false,
        selectedRows: action.payload.selectedRows,
      }
    }
    case 'SELECT_ALL_ROWS': {
      return {
        ...state,
        allRowsSelected: true,
        selectedRows: action.payload.selectedRows,
      }
    }
    case 'SET_ROWS': {
      return {
        ...state,
        rows: action.payload.rows,
      }
    }
    case 'SET_ROWS_COUNT': {
      return {
        ...state,
        totalRows: action.payload,
      }
    }
    case 'ADD_NEW_ROW': {
      const supaRow = { ...action.payload, idx: state.rows.length }
      const totalRows = state.totalRows + 1
      return {
        ...state,
        rows: update(state.rows, { $push: [supaRow] }),
        totalRows: totalRows,
      }
    }
    case 'EDIT_ROW': {
      const supaRow = { ...action.payload.row, idx: action.payload.idx }
      return {
        ...state,
        rows: update(state.rows, {
          [action.payload.idx]: { $set: supaRow },
        }),
      }
    }
    default:
      return state
  }
}

export default RowReducer
