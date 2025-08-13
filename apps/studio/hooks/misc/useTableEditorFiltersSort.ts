import { useRouter } from 'next/router'
import { useMemo } from 'react'

export const useTableEditorFiltersSort = () => {
  const router = useRouter()

  const urlParams = useMemo(() => {
    return new URLSearchParams(router.asPath.split('?')[1])
  }, [router.asPath])

  const filters = useMemo(() => {
    return urlParams.getAll('filter')
  }, [urlParams])

  const sorts = useMemo(() => {
    return urlParams.getAll('sort')
  }, [urlParams])

  type SetParamsArgs = {
    filter?: string[]
    sort?: string[]
  }

  const setParams = (fn: (prevParams: SetParamsArgs) => SetParamsArgs) => {
    const prevParams = { filter: filters, sort: sorts }
    const newParams = fn(prevParams)

    const hasFilter = newParams.filter !== undefined
    const hasSort = newParams.sort !== undefined

    router.push({
      query: {
        ...router.query,
        ...(hasFilter ? { filter: newParams.filter } : {}),
        ...(hasSort ? { sort: newParams.sort } : {}),
      },
    })
  }

  return {
    filters,
    sorts,
    setParams,
  }
}
