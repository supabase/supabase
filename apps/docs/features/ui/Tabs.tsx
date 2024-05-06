'use client'

import { useCallback, type ComponentProps } from 'react'
import { Tabs as TabsPrimitive } from 'ui'
import { withQueryParams } from 'ui-patterns/ComplexTabs'
import { useTocRerenderTrigger } from '~/components/GuidesTableOfContents'

const TabsWithQueryParams = withQueryParams(TabsPrimitive)

const TabPanel = TabsPrimitive.Panel
const Tabs = ({ onChange, ...props }: ComponentProps<typeof TabsWithQueryParams>) => {
  const rerenderToc = useTocRerenderTrigger()
  const onChangeInternal = useCallback(
    (...args: Parameters<typeof onChange>) => {
      rerenderToc()
      onChange?.(...args)
    },
    [rerenderToc, onChange]
  )

  return <TabsWithQueryParams wrappable onChange={onChangeInternal} {...props} />
}

export { Tabs, TabPanel }
