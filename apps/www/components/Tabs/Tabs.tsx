'use client'

import { useState, useEffect } from 'react'
import { cn, Tabs_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_, TabsContent_Shadcn_ } from 'ui'

export interface TabsProps {
  children: React.ReactNode
  className?: string
  defaultActiveId?: string
  listClassNames?: string
}

export interface TabPanelProps {
  children: React.ReactNode
  id: string
  label: string
  className?: string
}

function Tabs({ children, className, defaultActiveId, listClassNames }: TabsProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultActiveId)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Extract tab panels from children
  const tabPanels = Array.isArray(children) ? children : [children]
  const validTabPanels = tabPanels.filter(
    (child) => child && typeof child === 'object' && 'props' in child && child.props.id
  )

  if (validTabPanels.length === 0) return null

  const currentActiveTab = activeTab || validTabPanels[0]?.props?.id

  return (
    <div className={cn('not-prose', className)}>
      <Tabs_Shadcn_
        value={currentActiveTab}
        onValueChange={setActiveTab}
        className="w-full flex flex-col gap-4 [&_.ch-codeblock]:!mt-0"
      >
        <TabsList_Shadcn_ className={cn('shiki-wrapper flex', listClassNames)}>
          {validTabPanels.map((panel) => (
            <TabsTrigger_Shadcn_
              key={panel.props.id}
              value={panel.props.id}
              className="text-xs px-2.5"
            >
              {panel.props.label}
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>
        {validTabPanels.map((panel) => (
          <TabsContent_Shadcn_ key={panel.props.id} value={panel.props.id} className="mt-0">
            {panel.props.children}
          </TabsContent_Shadcn_>
        ))}
      </Tabs_Shadcn_>
    </div>
  )
}

function TabPanel({ children, id, label, className }: TabPanelProps) {
  return (
    <div className={cn('tab-panel', className)} data-id={id} data-label={label}>
      {children}
    </div>
  )
}

export { Tabs, TabPanel }
export default Tabs
