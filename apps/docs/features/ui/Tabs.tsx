'use client'

import { useCallback, type ComponentPropsWithoutRef, type PropsWithChildren } from 'react'
import { Tabs as TabsPrimitive, type TabsProps } from 'ui'
import { withQueryParams, withSticky, type QueryParamsProps } from 'ui-patterns/ComplexTabs'
import { useTocRerenderTrigger } from '~/components/GuidesTableOfContents'

const TabsWithStickyAndQueryParams = withSticky<PropsWithChildren<TabsProps & QueryParamsProps>>(
  withQueryParams(TabsPrimitive)
)

const TabPanel = TabsPrimitive.Panel
const Tabs = ({
  onChange,
  stickyTabList,
  ...props
}: ComponentPropsWithoutRef<typeof TabsWithStickyAndQueryParams>) => {
  const rerenderToc = useTocRerenderTrigger()
  const onChangeInternal = useCallback(
    (...args: Parameters<typeof onChange>) => {
      rerenderToc()
      onChange?.(...args)
    },
    [rerenderToc, onChange]
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
      stickyTabList={stickyTabList}
      {...props}
    />
  )
}

export { Tabs, TabPanel }
