import { FileJson2 } from 'lucide-react'
import { isValidElement, ReactNode } from 'react'

import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

interface MultipleCodeBlockTriggerProps {
  value: string
}

interface MultipleCodeBlockTriggersProps {
  children: ReactNode[]
}

interface MultipleCodeBlockProps {
  children: ReactNode[]
  value?: string
  onValueChange?: (value: string) => void
}

interface MultipleCodeBlockContentProps {
  children: ReactNode
  value: string
}

export const MultipleCodeBlock = ({ children, value, onValueChange }: MultipleCodeBlockProps) => {
  const firstChild = children[0]
  const defaultValue = isValidElement(firstChild)
    ? (firstChild.props as any)?.children[0]?.props?.value || ''
    : null

  return (
    <Tabs_Shadcn_ defaultValue={defaultValue} value={value} onValueChange={onValueChange}>
      {children}
    </Tabs_Shadcn_>
  )
}

export const MultipleCodeBlockTrigger = ({ value }: MultipleCodeBlockTriggerProps) => {
  return (
    <TabsTrigger_Shadcn_
      value={value}
      className="flex items-center gap-1 text-xs px-0 data-[state=active]:bg-transparent py-2.5"
    >
      <FileJson2 size={15} className="text-foreground-muted" />
      {value}
    </TabsTrigger_Shadcn_>
  )
}

export const MultipleCodeBlockTriggers = ({ children }: MultipleCodeBlockTriggersProps) => {
  return (
    <TabsList_Shadcn_ className="bg-surface-100 px-5 rounded-lg rounded-b-none gap-5 overflow-x-auto">
      {children}
    </TabsList_Shadcn_>
  )
}

export const MultipleCodeBlockContent = ({ value, children }: MultipleCodeBlockContentProps) => {
  return (
    <TabsContent_Shadcn_
      value={value}
      forceMount
      className="p-3 mt-1 max-h-72 overflow-scroll data-[state=inactive]:hidden"
      data-connect-tab-content
      data-tab-label={value}
    >
      {children}
    </TabsContent_Shadcn_>
  )
}
