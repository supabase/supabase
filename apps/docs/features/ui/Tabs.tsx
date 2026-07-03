'use client'

import { useTocRerenderTrigger } from '~/features/docs/GuidesMdx.state'
import { Children, isValidElement, useCallback } from 'react'

import { Tabs as TabsPrimitive, type TabsProps as TabsPrimitiveProps } from './UITabs'
import { useTabsWithQueryParams, type UseTabsWithQueryParamsOptions } from './withQueryParams'
import { useStickyTabs, UseStickyTabsOptions } from './withSticky'

const isString = (maybeStr: unknown): maybeStr is string => typeof maybeStr === 'string'

type TabsProps = TabsPrimitiveProps &
  Pick<UseTabsWithQueryParamsOptions, 'queryGroup'> & { stickyTabList?: UseStickyTabsOptions }

const TabPanel = TabsPrimitive.Panel
const Tabs = ({ children, onChange, stickyTabList, queryGroup, ...props }: TabsProps) => {
  // Avoid Children.toArray — it clones elements (accessing element.ref) which
  // triggers a React 19 warning. Children.forEach iterates without cloning.
  const tabIds: string[] = []
  Children.forEach(children, (child) => {
    if (isValidElement(child) && isString((child.props as any).id)) {
      tabIds.push((child.props as any).id)
    }
  })
  const { queryTab, onTabSelected: onTabSelectedForQuery } = useTabsWithQueryParams({
    tabIds,
    queryGroup,
  })
  const {
    observedRef,
    stickyRef,
    onTabSelected: onTabSelectedForSticky,
  } = useStickyTabs(stickyTabList)
  const rerenderToc = useTocRerenderTrigger()
  const onChangeInternal = useCallback(
    (id: string) => {
      onTabSelectedForSticky(id)
      onTabSelectedForQuery(id)
      rerenderToc()
      onChange?.(id)
    },
    [rerenderToc, onChange, onTabSelectedForSticky, onTabSelectedForQuery]
  )

  if (stickyTabList && !stickyTabList.scrollMarginTop) {
    // Magic number is the height of tab list + paragraph margin, worth getting
    // rid of this?
    stickyTabList.scrollMarginTop = 'calc(var(--header-height) + 43px + 20px)'
  }

  return (
    <TabsPrimitive
      wrappable
      onChange={onChangeInternal}
      refs={{ base: observedRef, list: stickyRef }}
      activeId={queryTab}
      {...props}
    >
      {children}
    </TabsPrimitive>
  )
}

export { TabPanel, Tabs }
