import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

export const useTableEditorFilters = () => {
  const router = useRouter()
  const urlParams = useMemo(() => {
    return new URLSearchParams(router.asPath.split('?')[1])
  }, [router.asPath])

  const urlFilters = urlParams.getAll('filter')
  const isNewSyntax = urlFilters.length > 0 && urlFilters[0].includes(',')

  const getFilters = useCallback(() => {
    if (isNewSyntax) return urlParams.getAll('filter')[0].split(',')
    return urlParams.getAll('filter')
  }, [isNewSyntax, urlParams])

  const filters = getFilters()
  const sorts = useMemo(() => {
    return urlParams.getAll('sort')
  }, [urlParams])

  const setParams = useCallback(
    (
      fn: (prevParams: { filter: string[]; sort: string[] }) => { filter: string[]; sort: string[] }
    ) => {
      const currentParams = { filter: getFilters(), sort: sorts ?? [] }
      const newParams = fn(currentParams)
      router.push({
        ...router,
        query: {
          ...router.query,
          filter: newParams.filter,
          sort: newParams.sort,
        },
      })
    },
    [getFilters, router, sorts]
  )

  return {
    filters,
    sorts,
    setParams,
  }
}
