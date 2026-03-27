import { useRouter as useCompatRouter } from 'next/compat/router'
import { usePathname, useRouter as useAppRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export const useTableEditorFiltersSort = () => {
  // Returns the pages-router instance, or null when running in the app router.
  const pagesRouter = useCompatRouter()
  // Always call navigation hooks unconditionally (Rules of Hooks).
  const appRouter = useAppRouter()
  const appSearchParams = useSearchParams()
  const pathname = usePathname()

  const isAppRouter = pagesRouter === null

  const urlParams = useMemo(() => {
    if (isAppRouter) {
      return appSearchParams ?? new URLSearchParams()
    }
    return new URLSearchParams(pagesRouter?.asPath.split('?')[1])
  }, [isAppRouter, pagesRouter, appSearchParams])

  const filters = useMemo(() => urlParams.getAll('filter'), [urlParams])
  const sorts = useMemo(() => urlParams.getAll('sort'), [urlParams])

  type SetParamsArgs = {
    filter?: string[]
    sort?: string[]
  }

  const setParams = useCallback(
    (fn: (prevParams: SetParamsArgs) => SetParamsArgs) => {
      const prevParams = { filter: filters, sort: sorts }
      const newParams = fn(prevParams)

      if (isAppRouter) {
        // Build a new search-params string and replace the URL shallowly.
        const next = new URLSearchParams(appSearchParams?.toString() ?? '')
        if (newParams.filter !== undefined) {
          next.delete('filter')
          for (const f of newParams.filter) next.append('filter', f)
        }
        if (newParams.sort !== undefined) {
          next.delete('sort')
          for (const s of newParams.sort) next.append('sort', s)
        }
        const qs = next.toString()
        appRouter.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
      } else {
        const hasFilter = newParams.filter !== undefined
        const hasSort = newParams.sort !== undefined
        pagesRouter?.push(
          {
            query: {
              ...pagesRouter.query,
              ...(hasFilter ? { filter: newParams.filter } : {}),
              ...(hasSort ? { sort: newParams.sort } : {}),
            },
          },
          undefined,
          { shallow: true }
        )
      }
    },
    [isAppRouter, pagesRouter, appRouter, appSearchParams, pathname, filters, sorts]
  )

  return { filters, sorts, setParams }
}
