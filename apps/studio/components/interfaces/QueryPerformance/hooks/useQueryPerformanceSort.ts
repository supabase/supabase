import { useQueryStates, parseAsString } from 'nuqs'
import { QueryPerformanceSort } from '../../Reports/Reports.queries'

export const useQueryPerformanceSort = () => {
  const [{ sort, order }, setQueryStates] = useQueryStates({
    sort: parseAsString,
    order: parseAsString,
  })

  const setSortConfig = (column: string, order: 'asc' | 'desc') => {
    setQueryStates({ sort: column, order })
  }

  const clearSort = () => {
    setQueryStates({ sort: null, order: null })
  }

  const sortConfig: QueryPerformanceSort | null =
    sort && order && ['asc', 'desc'].includes(order)
      ? { column: sort as QueryPerformanceSort['column'], order: order as 'asc' | 'desc' }
      : null

  return {
    sort: sortConfig,
    setSortConfig,
    clearSort,
  }
}
