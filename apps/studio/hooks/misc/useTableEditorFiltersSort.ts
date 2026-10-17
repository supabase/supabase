import { isEqual } from 'lodash'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

export const useTableEditorFiltersSort = () => {
  const router = useRouter()

  const urlParams = useMemo(() => {
    return new URLSearchParams(router.asPath.split('?')[1]?.split('#')[0])
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

  const setParams = useCallback(
    (fn: (prevParams: SetParamsArgs) => SetParamsArgs) => {
      const prevParams = { filter: filters, sort: sorts }
      const newParams = fn(prevParams)

      const hasFilter = newParams.filter !== undefined
      const hasSort = newParams.sort !== undefined
      const areFiltersUnchanged = !hasFilter || isEqual(newParams.filter, filters)
      const areSortsUnchanged = !hasSort || isEqual(newParams.sort, sorts)

      // A no-op URL sync must not create an entry that discards browser Forward history.
      if (areFiltersUnchanged && areSortsUnchanged) return

      const hashStart = router.asPath.indexOf('#')
      router.push(
        {
          hash: hashStart === -1 ? undefined : router.asPath.slice(hashStart),
          query: {
            ...router.query,
            ...(hasFilter ? { filter: newParams.filter } : {}),
            ...(hasSort ? { sort: newParams.sort } : {}),
          },
        },
        undefined,
        { shallow: true }
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, sorts]
  )

  return {
    filters,
    sorts,
    setParams,
  }
}
