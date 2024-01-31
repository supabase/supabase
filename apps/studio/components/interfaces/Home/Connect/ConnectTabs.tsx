import { Tabs_Shadcn_ } from 'ui'
import { FileJson2 } from 'lucide-react'
import { TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

interface ConnectTabTriggerProps {
  value: string
}
interface ConnectTabTriggersProps {
  children: any
}

interface ConnectFileTabProps {
  children: any
}

const ConnectTabs = ({ children }: ConnectFileTabProps) => {
  const defaultValue = children[0].props.children[0].props.value
  return <Tabs_Shadcn_ defaultValue={defaultValue}>{children}</Tabs_Shadcn_>
}

const ConnectTabTrigger = ({ value }: ConnectTabTriggerProps) => {
  return (
    <TabsTrigger_Shadcn_ value={value} className="flex items-center gap-1">
      <FileJson2 size={15} className="text-lighter" />
      {value}
    </TabsTrigger_Shadcn_>
  )
}

const ConnectTabTriggers = ({ children }: ConnectTabTriggersProps) => {
  return <TabsList_Shadcn_ defaultValue={'one'}>{children}</TabsList_Shadcn_>
}

export { ConnectTabTrigger, ConnectTabTriggers, ConnectTabs }
