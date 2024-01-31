import { FileJson2 } from 'lucide-react'
import { TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

interface ConnectTabTriggersProps {
  children: any
}

interface ConnectTabTriggerProps {
  value: string
  label: string
  location: string
}

export const ConnectTabTriggers = ({ children }: ConnectTabTriggersProps) => {
  return <TabsList_Shadcn_ defaultValue={'one'}>{children}</TabsList_Shadcn_>
}

export const ConnectTabTrigger = ({ value, label, location }: ConnectTabTriggerProps) => {
  return (
    <TabsTrigger_Shadcn_ value={value} className="flex items-center gap-1">
      <FileJson2 size={15} className="text-lighter" />
      {location}
      {label}
    </TabsTrigger_Shadcn_>
  )
}
