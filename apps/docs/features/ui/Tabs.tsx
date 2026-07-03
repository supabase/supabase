'use client'

import { useTocRerenderTrigger } from '~/features/docs/GuidesMdx.state'
import { useCallback } from 'react'

import { Tabs as TabsPrimitive, type TabsProps as TabsPrimitiveProps } from './UITabs'
import { withQueryParams, type QueryParamsProps } from './withQueryParams'
import { useStickyTabs, UseStickyTabsOptions } from './withSticky'

const TabsWithStickyAndQueryParams = withQueryParams(TabsPrimitive)

type TabsProps = TabsPrimitiveProps & QueryParamsProps & { stickyTabList?: UseStickyTabsOptions }

const TabPanel = TabsPrimitive.Panel
const Tabs = ({ onChange, stickyTabList, ...props }: TabsProps) => {
  const { observedRef, stickyRef, onTabSelected } = useStickyTabs(stickyTabList)
  const rerenderToc = useTocRerenderTrigger()
  const onChangeInternal = useCallback(
    (id: string) => {
      onTabSelected(id)
      rerenderToc()
      onChange?.(id)
    },
    [rerenderToc, onChange, onTabSelected]
  )

  if (stickyTabList && !stickyTabList.scrollMarginTop) {
    // Magic number is the height of tab list + paragraph margin, worth getting
    // rid of this?
    stickyTabList.scrollMarginTop = 'calc(var(--header-height) + 43px + 20px)'
  }

  return (
    <TabsWithStickyAndQueryParams
      wrappable
      onChange={onChangeInternal}
      refs={{ base: observedRef, list: stickyRef }}
      {...props}
    />
  )
}

export { TabPanel, Tabs }
