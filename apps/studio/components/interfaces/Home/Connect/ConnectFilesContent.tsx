import { FileJson2 } from 'lucide-react'
import { TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import ConnectPath from './ConnectPath'

interface ConnectFileTabProps {
  children: any
  location: string
  value: string
}
export const ConnectTabContent = ({ value, children, location }: ConnectFileTabProps) => {
  return (
    <TabsContent_Shadcn_ value={value}>
      <ConnectPath path={location} />
      {children}
    </TabsContent_Shadcn_>
  )
}
