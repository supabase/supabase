import { CalculatedColumn } from 'react-data-grid'
import { ADD_COLUMN_KEY, SELECT_COLUMN_KEY } from '../constants'
import type { SavedState } from '../types'
import { deepClone } from './common'

export function cloneColumn(column: CalculatedColumn<any, any>) {
  const cloned = deepClone(column)
  // these properties can't be cloned. Need to manual re-set again
  cloned.renderEditCell = column.renderEditCell
  cloned.renderHeaderCell = column.renderHeaderCell
  cloned.renderCell = column.renderCell
  cloned.renderGroupCell = column.renderGroupCell
  return cloned
}

export function getInitialGridColumns(
  gridColumns: CalculatedColumn<any, any>[],
  savedState?: SavedState
) {
  let result = gridColumns

  if (savedState?.gridColumns) {
    result = []

    // filter utility columns select, add-column
    const stateColumnsFiltered = savedState.gridColumns.filter((x) => x?.name !== '')

    for (let i = 0; i < stateColumnsFiltered.length; i++) {
      const state = stateColumnsFiltered[i]
      const found = gridColumns.find((y) => y.key === state.key)
      // merge with savedState item props: width
      if (found) result.push({ ...found, width: state.width, frozen: state.frozen })
    }

    // check for newly created columns
    const newGridColumns = gridColumns.filter((x) => {
      // no existed in stateColumnsFiltered and not utility column
      const found = stateColumnsFiltered.find((state) => state.key === x.key)
      return !found && x.name !== ''
    })
    result = result.concat(newGridColumns)

    // process utility columns
    const selectColumn = gridColumns.find((x) => x.key === SELECT_COLUMN_KEY)
    if (selectColumn) {
      result = [selectColumn, ...result]
    }
    const addColumn = gridColumns.find((x) => x.key === ADD_COLUMN_KEY)
    if (addColumn) {
      result.push(addColumn)
    }
  }

  return result
}
