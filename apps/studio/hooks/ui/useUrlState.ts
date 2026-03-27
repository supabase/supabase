import useLatest from 'hooks/misc/useLatest'
import { useRouter } from 'next/compat/router'
import { type Dispatch, type SetStateAction, useCallback, useMemo } from 'react'

export type UrlStateParams = {
  [k: string]: string | string[] | undefined
}

/** @deprecated Use useQueryState from nuqs instead for URL state */
export function useUrlState<ValueParams extends UrlStateParams>({
  replace = true,
  arrayKeys = [],
}: {
  /** Whether to use push state routing (working back button), or just replace the current URL
   * @default true
   */
  replace?: boolean
  arrayKeys?: string[]
} = {}): [ValueParams, Dispatch<SetStateAction<ValueParams>>] {
  const stringifiedArrayKeys = JSON.stringify(arrayKeys)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const arrayKeysSet = useMemo(() => new Set(arrayKeys), [stringifiedArrayKeys])
  const router = useRouter()
  const query = router?.query ?? {}
  const pathname =
    router?.pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '')

  const params: ValueParams = useMemo(() => {
    return Object.fromEntries(
      Object.entries(query).map(([key, value]) => {
        if (arrayKeysSet.has(key)) {
          return Array.isArray(value) ? [key, value] : [key, [value]]
        }

        return [key, value]
      })
    )
  }, [arrayKeysSet, query])

  const paramsRef = useLatest(params)

  const setParams: Dispatch<SetStateAction<ValueParams>> = useCallback(
    (newParams) => {
      const params = paramsRef.current

      const nextParams = typeof newParams === 'function' ? newParams(params) : newParams
      let newQuery = Object.fromEntries(
        Object.entries({ ...params, ...nextParams }).filter(([, value]) => Boolean(value))
      )

      const replaceOrPush = replace ? router?.replace : router?.push

      if (!replaceOrPush || !pathname) return

      replaceOrPush(
        {
          pathname,
          query: newQuery,
        },
        undefined,
        { shallow: true, scroll: false }
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, replace, pathname]
  )

  return [params, setParams] as const
}
