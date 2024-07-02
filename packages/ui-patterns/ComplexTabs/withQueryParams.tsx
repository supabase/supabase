import { useSearchParamsShallow } from 'common'
import { xor } from 'lodash'
import { Children, useEffect, useRef, type FC, type PropsWithChildren } from 'react'
import { type TabsProps } from 'ui'

const isString = (maybeStr: unknown): maybeStr is string => typeof maybeStr === 'string'

const LOCAL_STORAGE_KEY = 'supabase.ui-patterns.ComplexTabs.withQueryParams.v0'

interface QueryParamsProps {
  queryGroup?: string
}

/**
 * Wraps the basic `Tabs` component from the `ui` library so it stores
 * selection state in query params.
 */
const withQueryParams =
  <Props extends PropsWithChildren<TabsProps>>(
    Component: FC<Omit<Props, 'children' | 'queryGroup' | 'onClick'>>
  ) =>
  ({
    children: childrenUnvalidated,
    queryGroup: queryGroupTemp,
    onClick,
    ...props
  }: Props & QueryParamsProps) => {
    const children = Children.toArray(childrenUnvalidated)
    const tabIdsTemp = children
      .map((child) => !!child && typeof child === 'object' && 'props' in child && child.props.id)
      .filter(isString)
    // Store in ref to avoid stale data in later timeout
    const tabIdsRef = useRef(tabIdsTemp)
    tabIdsRef.current = tabIdsTemp

    // Store in ref to avoid stale data in later timeout
    const queryGroupRef = useRef(queryGroupTemp)
    queryGroupRef.current = queryGroupTemp

    const searchParams = useSearchParamsShallow()
    const queryTabMaybe = queryGroupRef.current && searchParams.get(queryGroupRef.current)
    const queryTab =
      queryTabMaybe && tabIdsRef.current.includes(queryTabMaybe) ? queryTabMaybe : undefined

    const checkedLocalStorage = useRef(false)
    useEffect(() => {
      if (!checkedLocalStorage.current) {
        // Timeout to avoid something (I think the router) overwriting it
        setTimeout(() => {
          if (
            queryGroupRef.current &&
            !new URLSearchParams(window.location.search).has(queryGroupRef.current)
          ) {
            try {
              const storedValues = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '')
              if (storedValues === null || typeof storedValues !== 'object') return

              let storedValue: any = null
              let maxDiff = tabIdsRef.current.length
              Object.entries(storedValues).forEach(([key, value]) => {
                const arr = key.split(',')
                const diff = xor(arr, tabIdsRef.current)
                if (diff.length < maxDiff) {
                  maxDiff = diff.length
                  storedValue = value
                }
              })

              if (storedValue && tabIdsRef.current.includes(storedValue)) {
                switchTab(storedValue)
              }
            } catch {
              // ignore
            }
          }
        }, 300)

        checkedLocalStorage.current = true
      }

      if (queryGroupRef.current && queryTab) {
        let updatedValues: Record<string, unknown> = {}
        try {
          const oldValues = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '')
          if (oldValues && typeof oldValues === 'object') {
            updatedValues = oldValues
          }
        } catch {
          // ignore
        }

        updatedValues[tabIdsRef.current.sort().join(',')] = queryTab

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedValues))
        } catch {
          // ignore
        }
      }
    }, [queryTab])

    const switchTab = (id: string) => {
      if (queryGroupRef.current) {
        if (!searchParams.getAll('queryGroups').includes(queryGroupRef.current)) {
          searchParams.append('queryGroups', queryGroupRef.current)
        }
        searchParams.set(queryGroupRef.current, id)
      }
    }

    const onTabClick = (id: string) => {
      switchTab(id)
      onClick?.(id)
    }

    return (
      <Component {...props} activeId={queryTab} onClick={onTabClick}>
        {/* Tabs does its own validation */}
        {childrenUnvalidated}
      </Component>
    )
  }

export { withQueryParams }
export type { QueryParamsProps }
