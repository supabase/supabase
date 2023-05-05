import update from 'immutability-helper'
import { REFRESH_PAGE_IMMEDIATELY, TOTAL_ROWS_INITIAL, TOTAL_ROWS_RESET } from '../../constants'
import { Dictionary, SupaRow } from '../../types'
import { INIT_ACTIONTYPE } from './base'

export interface RowInitialState {
  isLoading: boolean
  rows: SupaRow[]
  selectedRows: ReadonlySet<number>
  selectedCellPosition: { idx: number; rowIdx: number } | null
  page: number
  rowsPerPage: number
  totalRows: number
}

export const rowInitialState: RowInitialState = {
  isLoading: false,
  rows: [],
  selectedRows: new Set(),
  selectedCellPosition: null,
  page: 1,
  rowsPerPage: 100,
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
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ROWS_PER_PAGE'; payload: number }
  | {
      type: 'SET_ROWS'
      payload: { rows: SupaRow[] }
    }
  | {
      type: 'SET_ROWS_COUNT'
      payload: number
    }
  | { type: 'ADD_ROWS'; payload: SupaRow[] }
  | { type: 'ADD_NEW_ROW'; payload: Dictionary<any> }
  | { type: 'EDIT_ROW'; payload: { row: Dictionary<any>; idx: number } }
  | { type: 'REMOVE_ROWS'; payload: { rowIdxs: number[] } }
  | { type: 'REMOVE_ALL_ROWS' }
  | { type: 'SET_IS_LOADING'; payload: { isLoading: boolean } }
  | { type: 'SELECT_ALL_ROWS'; payload: { selectedRows: ReadonlySet<number> } }

const RowReducer = (state: RowInitialState, action: ROW_ACTIONTYPE) => {
  switch (action.type) {
    case 'INIT_TABLE': {
      return {
        ...state,
        page: 1,
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
    case 'SET_PAGE': {
      return {
        ...state,
        page: action.payload,
        refreshPageFlag: REFRESH_PAGE_IMMEDIATELY,
      }
    }
    case 'SET_ROWS_PER_PAGE': {
      return {
        ...state,
        page: 1,
        rowsPerPage: action.payload,
        refreshPageFlag: REFRESH_PAGE_IMMEDIATELY,
      }
    }
    case 'SET_ROWS': {
      return {
        ...state,
        rows: action.payload.rows,
        refreshPageFlag: 0,
      }
    }
    case 'SET_ROWS_COUNT': {
      return {
        ...state,
        totalRows: action.payload,
      }
    }
    case 'ADD_ROWS': {
      const totalRows = state.totalRows + action.payload.length
      return {
        ...state,
        rows: update(state.rows, { $push: action.payload }),
        totalRows: totalRows,
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
    case 'REMOVE_ALL_ROWS': {
      return {
        ...state,
        rows: [],
        totalRows: 0,
      }
    }
    case 'SET_IS_LOADING': {
      return {
        ...state,
        isLoading: action.payload.isLoading,
      }
    }
    default:
      return state
  }
}

export default RowReducer
