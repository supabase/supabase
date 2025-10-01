import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'

export const useTableEditorFiltersSort = () => {
  const [{ sort, filter }, updateUrlParams] = useQueryStates({
    sort: parseAsArrayOf(parseAsString).withDefault([]),
    filter: parseAsArrayOf(parseAsString).withDefault([]),
  })

  type SetParamsArgs = {
    filter?: string[]
    sort?: string[]
  }

  const setParams = (fn: (prevParams: SetParamsArgs) => SetParamsArgs) => {
    const prevParams = { filter, sort }
    const newParams = fn(prevParams)

    const hasFilter = newParams.filter !== undefined
    const hasSort = newParams.sort !== undefined

    updateUrlParams(
      {
        sort: hasSort ? newParams.sort : [],
        filter: hasFilter ? newParams.filter : [],
      },
      { clearOnDefault: true }
    )
  }

  return {
    filters: filter,
    sorts: sort,
    setParams,
  }
}
