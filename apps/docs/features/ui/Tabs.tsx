'use client'

import { type ComponentProps } from 'react'
import { Tabs as TabsPrimitive } from 'ui'

const TabPanel = TabsPrimitive.Panel
const Tabs = (props: ComponentProps<typeof TabsPrimitive>) => <TabsPrimitive wrappable {...props} />

export { Tabs, TabPanel }
