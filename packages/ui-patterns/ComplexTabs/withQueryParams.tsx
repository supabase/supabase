import { useSearchParamsShallow } from 'common'
import { Children, type PropsWithChildren } from 'react'
import { type Tabs, type TabsProps } from 'ui'

const isString = (maybeStr: unknown): maybeStr is string => typeof maybeStr === 'string'

// TODO: save state in localStorage

/**
 * Wraps the basic `Tabs` component from the `ui` library so it stores
 * selection state in query params.
 */
const withQueryParams =
  (Component: typeof Tabs) =>
  ({
    children: childrenUnvalidated,
    queryGroup,
    onClick,
    ...props
  }: PropsWithChildren<TabsProps & { queryGroup?: string }>) => {
    const children = Children.toArray(childrenUnvalidated)
    const tabIds = children
      .map((child) => !!child && typeof child === 'object' && 'props' in child && child.props.id)
      .filter(isString)

    const searchParams = useSearchParamsShallow()
    const queryTabMaybe = (queryGroup && searchParams.get(queryGroup)) ?? undefined
    // @ts-ignore - checking if tabIds: string[] includes undefined is fine
    const queryTab = (tabIds.includes(queryTabMaybe) && queryTabMaybe) || undefined

    const onTabClick = (id: string) => {
      if (queryGroup) {
        if (!searchParams.getAll('queryGroups').includes(queryGroup)) {
          searchParams.append('queryGroups', queryGroup)
        }
        searchParams.set(queryGroup, id)
      }

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
