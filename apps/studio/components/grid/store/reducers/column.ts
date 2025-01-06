import update from 'immutability-helper'
import type { CalculatedColumn } from 'react-data-grid'
import { cloneColumn, getInitialGridColumns } from '../../utils/column'
import { INIT_ACTIONTYPE } from './base'

export interface ColumnInitialState {
  gridColumns: CalculatedColumn<any, any>[]
}

export const columnInitialState: ColumnInitialState = {
  gridColumns: [],
}

type COLUMN_ACTIONTYPE =
  | INIT_ACTIONTYPE
  | {
      type: 'MOVE_COLUMN'
      payload: { fromKey: string; toKey: string }
    }
  | {
      type: 'UPDATE_COLUMN_SIZE'
      payload: { index: number; width: number }
    }
  | {
      type: 'FREEZE_COLUMN'
      payload: { columnKey: string }
    }
  | {
      type: 'UNFREEZE_COLUMN'
      payload: { columnKey: string }
    }
  | {
      type: 'UPDATE_COLUMN_IDX'
      payload: { columnKey: string; columnIdx: number }
    }

const ColumnReducer = (state: ColumnInitialState, action: COLUMN_ACTIONTYPE) => {
  switch (action.type) {
    case 'INIT_TABLE': {
      return {
        ...state,
        gridColumns: getInitialGridColumns(action.payload.gridColumns, action.payload.savedState),
      }
    }
    case 'MOVE_COLUMN': {
      const fromIdx = state.gridColumns.findIndex((x) => x.key === action.payload.fromKey)
      const toIdx = state.gridColumns.findIndex((x) => x.key === action.payload.toKey)
      const moveItem = state.gridColumns[fromIdx]
      return {
        ...state,
        gridColumns: update(state.gridColumns, {
          $splice: [
            [fromIdx, 1],
            [toIdx, 0, moveItem],
          ],
        }),
      }
    }
    case 'UPDATE_COLUMN_SIZE': {
      const updated = cloneColumn(state.gridColumns[action.payload.index])
      updated.width = action.payload.width
      return {
        ...state,
        gridColumns: update(state.gridColumns, {
          [action.payload.index]: { $set: updated },
        }),
      }
    }
    case 'FREEZE_COLUMN': {
      const columnIdx = state.gridColumns.findIndex((x) => x.key === action.payload.columnKey)
      const updated = cloneColumn(state.gridColumns[columnIdx])
      updated.frozen = true
      return {
        ...state,
        gridColumns: update(state.gridColumns, {
          [columnIdx]: { $set: updated },
        }),
      }
    }
    case 'UNFREEZE_COLUMN': {
      const columnIdx = state.gridColumns.findIndex((x) => x.key === action.payload.columnKey)
      const updated = cloneColumn(state.gridColumns[columnIdx])
      updated.frozen = false
      return {
        ...state,
        gridColumns: update(state.gridColumns, {
          [columnIdx]: { $set: updated },
        }),
      }
    }
    case 'UPDATE_COLUMN_IDX': {
      const index = state.gridColumns.findIndex((x) => x.key === action.payload.columnKey)
      const updated = cloneColumn(state.gridColumns[index])
      updated.idx = action.payload.columnIdx
      return {
        ...state,
        gridColumns: update(state.gridColumns, {
          [index]: { $set: updated },
        }).sort((a, b) => a.idx - b.idx),
      }
    }
    default:
      return state
  }
}

export default ColumnReducer
