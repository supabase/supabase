import { uuidv4 } from 'lib/helpers'
import { Filter, SavedState, SupaTable } from '../types'

export function getInitialFilters(table: SupaTable, savedState?: SavedState): Filter[] {
  if (savedState?.filters) {
    // verify column still exists
    const filters = savedState.filters.filter((x) => {
      const found = table.columns.find((y) => y.name === x.column)
      return found ? true : false
    })
    if (filters?.length > 0) {
      return filters.map((filter) => ({ ...filter, id: filter?.id || uuidv4() }))
    }
  }
  return []
}
