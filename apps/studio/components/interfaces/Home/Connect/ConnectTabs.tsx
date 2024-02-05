import { Tabs_Shadcn_ } from 'ui'
import { FileJson2 } from 'lucide-react'
import { TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { TabsContent_Shadcn_ } from 'ui'
import React, { ReactNode } from 'react'

interface ConnectTabTriggerProps {
  value: string
}
interface ConnectTabTriggersProps {
  children: ReactNode[]
}

interface ConnectFileTabProps {
  children: ReactNode[]
}

interface ConnectTabContentProps {
  children: ReactNode
  value: string
}
const ConnectTabs = ({ children }: ConnectFileTabProps) => {
  const firstChild = children[0]

  const defaultValue = React.isValidElement(firstChild)
    ? (firstChild.props as any)?.children[0]?.props?.value || ''
    : null

  return <Tabs_Shadcn_ defaultValue={defaultValue}>{children}</Tabs_Shadcn_>
}

const ConnectTabTrigger = ({ value }: ConnectTabTriggerProps) => {
  return (
    <TabsTrigger_Shadcn_
      value={value}
      className="flex items-center gap-1 text-xs p-2 py-3 data-[state=active]:bg-transparent"
    >
      <FileJson2 size={15} className="text-lighter" />
      {value}
    </TabsTrigger_Shadcn_>
  )
}

const ConnectTabTriggers = ({ children }: ConnectTabTriggersProps) => {
  return (
    <TabsList_Shadcn_ className="bg-surface-100 px-1.5 rounded-lg rounded-b-none">
      {children}
    </TabsList_Shadcn_>
  )
}

export const ConnectTabContent = ({ value, children }: ConnectTabContentProps) => {
  return (
    <TabsContent_Shadcn_ value={value} className="p-3 mt-1 max-h-72 overflow-scroll">
      {children}
    </TabsContent_Shadcn_>
  )
}

export { ConnectTabTrigger, ConnectTabTriggers, ConnectTabs }
