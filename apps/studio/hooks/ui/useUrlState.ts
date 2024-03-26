import { useCallback } from 'react'
import { useRouter } from 'next/router'

export type UrlStateParams = {
  [k: string]: string | string[] | undefined
}

export function useUrlState({
  replace = true,
  arrayKeys = [],
}: {
  /** Whether to use push state routing (working back button), or just replace the current URL
   * @default true
   */
  replace?: boolean
  arrayKeys?: string[]
} = {}) {
  const arrayKeysSet = new Set(arrayKeys)
  const router = useRouter()

  const params: UrlStateParams = Object.fromEntries(
    Object.entries(router.query).map(([key, value]) => {
      if (arrayKeysSet.has(key)) {
        return Array.isArray(value) ? [key, value] : [key, [value]]
      }

      return [key, value]
    })
  )

  const setParams = useCallback(
    (newParams: UrlStateParams | ((previousParams: UrlStateParams) => UrlStateParams)) => {
      const nextParams = typeof newParams === 'function' ? newParams(params) : newParams
      let newQuery = Object.fromEntries(
        Object.entries({ ...params, ...nextParams }).filter(([, value]) => Boolean(value))
      )

      const replaceOrPush = replace ? router.replace : router.push

      replaceOrPush(
        {
          pathname: router.pathname,
          query: newQuery,
        },
        undefined,
        { shallow: true, scroll: false }
      )
    },
    [router, params, replace]
  )

  return [params, setParams] as const
}
