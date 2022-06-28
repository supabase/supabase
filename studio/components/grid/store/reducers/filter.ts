import { TOTAL_ROWS_RESET } from '../../constants'
import { Filter } from '../../types'

// [JOSHEN TODO] Should be able to deprecate this entire reducer

export interface FilterInitialState {
  filters: Filter[]
}

export const filterInitialState: FilterInitialState = { filters: [] }

type FILTER_ACTIONTYPE = {
  type: 'UPDATE_FILTERS'
  payload: {}
}

const FilterReducer = (state: FilterInitialState, action: FILTER_ACTIONTYPE) => {
  switch (action.type) {
    case 'UPDATE_FILTERS': {
      // [JOSHEN TODO] THIS COULD BE AT THE BASE REDUCER UPDATE FILTER SORT FOR EG
      const newState: any = { ...state }
      newState.page = 1
      newState.refreshPageFlag = Date.now()
      newState.totalRows = TOTAL_ROWS_RESET
      return newState
    }
    default:
      return state
  }
}

export default FilterReducer
