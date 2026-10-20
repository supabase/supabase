import { useRouter } from 'next/compat/router'
import {
  renderQueryString,
  unstable_createAdapterProvider,
  type unstable_AdapterInterface,
  type unstable_UpdateUrlFunction,
} from 'nuqs/adapters/custom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// NOTE: the stock pages adapter leaves a flushed value queued while its router
// update is still resolving, and it skips its own queue reset in that window.
// after Back, parse prefers the queue over the address bar. this adapter clears
// on flush and drops the held search on a traverse so the url wins.

export type PagesAdapterMode = 'router' | 'hold' | 'live'

export function selectPagesAdapterSearch({
  mode,
  hold,
  liveSearch,
  routerSearch,
}: {
  mode: PagesAdapterMode
  hold: URLSearchParams | null
  liveSearch: URLSearchParams
  routerSearch: URLSearchParams
}): URLSearchParams {
  if (mode === 'live') {
    return liveSearch
  }

  if (mode === 'hold' && hold) {
    return hold
  }

  return routerSearch
}

// nuqs throttles url writes (50ms in chrome, up to 320ms in safari). a traverse
// with no flush inside that window must not swallow the next edit.
const PENDING_FLUSH_WINDOW_MS = 400

// A traverse that lands before the queued flush must not be overwritten by that flush.
export function shouldApplyNuqsUrlUpdate(hasPendingTraverse: boolean): boolean {
  if (hasPendingTraverse) {
    return false
  }

  return true
}

export function searchReflects(source: URLSearchParams, expected: URLSearchParams): boolean {
  const keys = [...new Set(expected.keys())]

  return keys.every((key) => source.getAll(key).join('\0') === expected.getAll(key).join('\0'))
}

export function sameSearch(left: URLSearchParams, right: URLSearchParams): boolean {
  return searchReflects(left, right) && searchReflects(right, left)
}

export function queryFromAsPath(asPath: string | undefined): URLSearchParams {
  const query = asPath?.split('?')[1]?.split('#')[0] ?? ''

  return new URLSearchParams(query)
}

export function routerQueryToSearchParams(
  query: Record<string, unknown> | undefined
): URLSearchParams {
  const search = new URLSearchParams()

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (typeof value === 'string') {
      search.set(key, value)
      return
    }

    if (!Array.isArray(value)) {
      return
    }

    value.forEach((item) => {
      if (typeof item === 'string') {
        search.append(key, item)
      }
    })
  })

  return search
}

export function extractDynamicUrlParams(
  pathname: string,
  values: Record<string, string | string[] | undefined>
): Record<string, string | string[] | undefined> {
  const paramNames = [...pathname.matchAll(/\[([^\]]+)\]/g)]
    .map((match) => match[1])
    .filter((name): name is string => Boolean(name))

  const dynamicValues: Record<string, string | string[] | undefined> = Object.fromEntries(
    Object.entries(values).filter(([key]) => paramNames.includes(key))
  )

  const catchAllKey = /\[\.{3}([^\]]+)\]$/.exec(pathname)?.[1]
  if (catchAllKey) {
    dynamicValues[catchAllKey] = values[catchAllKey] ?? []
  }

  const optionalCatchAllKey = /\[\[\.{3}([^\]]+)\]\]$/.exec(pathname)?.[1]
  if (optionalCatchAllKey) {
    dynamicValues[optionalCatchAllKey] = values[optionalCatchAllKey] ?? []
  }

  return dynamicValues
}

function getAsPathPathname(asPath: string): string {
  return asPath.replace(/#.*$/, '').replace(/\?.*$/, '')
}

function urlSearchParamsToObject(search: URLSearchParams): Record<string, string | string[]> {
  return Object.fromEntries(
    [...new Set(search.keys())].flatMap((key) => {
      const values = search.getAll(key)
      const value = values.length > 1 ? values : values[0]

      if (value === undefined) {
        return []
      }

      return [[key, value]]
    })
  )
}

type PagesRouterLike = {
  pathname: string
  asPath: string
  query: Record<string, string | string[] | undefined>
  push: (
    url: { pathname: string; query: Record<string, string | string[] | undefined> },
    as?: string,
    options?: { scroll?: boolean; shallow?: boolean }
  ) => Promise<boolean>
  replace: (
    url: { pathname: string; query: Record<string, string | string[] | undefined> },
    as?: string,
    options?: { scroll?: boolean; shallow?: boolean }
  ) => Promise<boolean>
}

function isQueryRecord(value: unknown): value is Record<string, string | string[] | undefined> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  return Object.values(value).every(
    (item) =>
      item === undefined ||
      typeof item === 'string' ||
      (Array.isArray(item) && item.every((entry) => typeof entry === 'string'))
  )
}

function isPagesRouter(value: unknown): value is PagesRouterLike {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const router = value as Record<string, unknown>
  const hasMethods = typeof router.push === 'function' && typeof router.replace === 'function'
  const hasPaths = typeof router.pathname === 'string' && typeof router.asPath === 'string'

  return hasMethods && hasPaths && isQueryRecord(router.query)
}

function readPagesRouter(): PagesRouterLike | null {
  if (typeof window === 'undefined') {
    return null
  }

  const host = window as Window & { next?: { router?: unknown } }
  const router = host.next?.router

  if (!isPagesRouter(router)) {
    return null
  }

  return router
}

function useNuqsPagesRouterAdapter(watchKeys: string[]): unstable_AdapterInterface {
  const router = useRouter()
  const [mode, setMode] = useState<PagesAdapterMode>('router')
  const [hold, setHold] = useState<string | null>(null)
  const [, setEpoch] = useState(0)
  const skipNextWrite = useRef(false)
  const writeInFlight = useRef(false)
  const skipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchKey = watchKeys.join(',')

  useEffect(() => {
    const onPopState = () => {
      if (!writeInFlight.current) {
        skipNextWrite.current = true

        if (skipTimer.current) {
          clearTimeout(skipTimer.current)
        }

        skipTimer.current = setTimeout(() => {
          skipNextWrite.current = false
          skipTimer.current = null
        }, PENDING_FLUSH_WINDOW_MS)
      }

      setHold(null)
      setMode('live')
      setEpoch((current) => current + 1)
    }

    window.addEventListener('popstate', onPopState, true)

    return () => {
      window.removeEventListener('popstate', onPopState, true)

      if (skipTimer.current) {
        clearTimeout(skipTimer.current)
      }
    }
  }, [])

  const routerSearch = useMemo(
    () => routerQueryToSearchParams(router?.query),
    // router.query is a new object when the pages router navigates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(router?.query), watchKey]
  )

  const liveSearchKey = typeof window === 'undefined' ? '' : window.location.search
  const liveSearch = useMemo(() => new URLSearchParams(liveSearchKey), [liveSearchKey])
  const holdSearch = useMemo(() => (hold === null ? null : new URLSearchParams(hold)), [hold])

  const routerAddressSearch = useMemo(() => queryFromAsPath(router?.asPath), [router?.asPath])

  useEffect(() => {
    const shouldReleaseHold =
      mode === 'hold' && holdSearch !== null && sameSearch(routerAddressSearch, holdSearch)
    const shouldReleaseLive = mode === 'live' && sameSearch(routerAddressSearch, liveSearch)

    if (!shouldReleaseHold && !shouldReleaseLive) {
      return
    }

    setHold(null)
    setMode('router')
  }, [mode, holdSearch, routerAddressSearch, liveSearch])

  const searchParams = useMemo(
    () =>
      selectPagesAdapterSearch({
        mode,
        hold: holdSearch,
        liveSearch,
        routerSearch,
      }),
    [mode, holdSearch, liveSearch, routerSearch]
  )

  const updateUrl: unstable_UpdateUrlFunction = useCallback((search, options) => {
    const shouldApply = shouldApplyNuqsUrlUpdate(skipNextWrite.current)
    skipNextWrite.current = false

    if (skipTimer.current) {
      clearTimeout(skipTimer.current)
      skipTimer.current = null
    }

    if (!shouldApply) {
      setHold(null)
      setMode('live')
      setEpoch((current) => current + 1)
      return
    }

    const pagesRouter = readPagesRouter()

    if (!pagesRouter) {
      return
    }

    writeInFlight.current = true
    setHold(search.toString())
    setMode('hold')
    setEpoch((current) => current + 1)

    const asPath =
      getAsPathPathname(pagesRouter.asPath) +
      renderQueryString(search) +
      (typeof window === 'undefined' ? '' : window.location.hash)
    const method = options.history === 'push' ? pagesRouter.push : pagesRouter.replace

    try {
      method
        .call(
          pagesRouter,
          {
            pathname: pagesRouter.pathname,
            query: {
              ...urlSearchParamsToObject(search),
              ...extractDynamicUrlParams(pagesRouter.pathname, pagesRouter.query),
            },
          },
          asPath,
          { scroll: options.scroll, shallow: options.shallow }
        )
        .finally(() => {
          writeInFlight.current = false
        })
    } catch (error) {
      writeInFlight.current = false
      setHold(null)
      setMode('router')
      throw error
    }
  }, [])

  return {
    searchParams,
    updateUrl,
    autoResetQueueOnUpdate: true,
  }
}

export const NuqsAdapter = unstable_createAdapterProvider(useNuqsPagesRouterAdapter)
