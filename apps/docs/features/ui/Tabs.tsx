'use client'

import { useCallback, type ComponentProps } from 'react'
import { Tabs as TabsPrimitive } from 'ui'
import { useTocRerenderTrigger } from '~/components/GuidesTableOfContents'

const TabPanel = TabsPrimitive.Panel
const Tabs = ({ onChange, ...props }: ComponentProps<typeof TabsPrimitive>) => {
  const rerenderToc = useTocRerenderTrigger()
  const onChangeInternal = useCallback(
    (...args: Parameters<typeof onChange>) => {
      rerenderToc()
      onChange?.(...args)
    },
    [rerenderToc, onChange]
  )

  return <TabsPrimitive wrappable onChange={onChangeInternal} {...props} />
}

export { Tabs, TabPanel }
