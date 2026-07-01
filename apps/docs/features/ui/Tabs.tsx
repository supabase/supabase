'use client'

import { useTocRerenderTrigger } from '~/features/docs/GuidesMdx.state'
import { useCallback, type ComponentPropsWithoutRef, type PropsWithChildren } from 'react'
import { DocsTabs } from 'ui'
import { withQueryParams, withSticky, type QueryParamsProps } from 'ui-patterns/ComplexTabs'

const TabsWithStickyAndQueryParams = withSticky<
  PropsWithChildren<DocsTabs.TabsProps & QueryParamsProps>
>(withQueryParams(DocsTabs.Tabs))

const TabPanel = DocsTabs.Tabs.Panel
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

export { TabPanel, Tabs }
