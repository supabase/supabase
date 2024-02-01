import { FileJson2 } from 'lucide-react'
import { TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

interface ConnectTabContentProps {
  children: any
  value: string
}
export const ConnectTabContent = ({ value, children }: ConnectTabContentProps) => {
  return <TabsContent_Shadcn_ value={value}>{children}</TabsContent_Shadcn_>
}
