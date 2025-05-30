import { User } from 'data/auth/users-infinite-query'
import { X } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  cn,
  Input_Shadcn_,
  ResizableHandle,
  ResizablePanel,
  SimpleCodeBlock,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { UserLogs } from './UserLogs'
import { UserOverview } from './UserOverview'
import { PANEL_PADDING } from './Users.constants'

interface UserPanelProps {
  selectedUser?: User
  onClose: () => void
}

export const UserPanel = ({ selectedUser, onClose }: UserPanelProps) => {
  const [view, setView] = useState<'overview' | 'raw' | 'logs'>('overview')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProperties = selectedUser
    ? Object.entries(selectedUser)
        .filter(
          ([key, value]) =>
            key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .reduce((obj, [key, value]) => {
          if (value !== undefined) {
            obj[key as keyof User] = value as any
          }
          return obj
        }, {} as Partial<User>)
    : {}

  return (
    <>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={30} maxSize={45} minSize={30} className="bg-studio border-t">
        <Button
          type="text"
          className="absolute top-3 right-3 px-1"
          icon={<X />}
          onClick={() => onClose()}
        />
        <Tabs_Shadcn_
          value={view}
          className="flex flex-col h-full"
          onValueChange={(value: any) => setView(value)}
        >
          <TabsList_Shadcn_ className="px-5 flex gap-x-4 min-h-[46px]">
            <TabsTrigger_Shadcn_
              value="overview"
              className="px-0 pb-0 h-full text-xs  data-[state=active]:bg-transparent !shadow-none"
            >
              Overview
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_
              value="logs"
              className="px-0 pb-0 h-full text-xs data-[state=active]:bg-transparent !shadow-none"
            >
              Logs
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_
              value="raw"
              className="px-0 pb-0 h-full text-xs data-[state=active]:bg-transparent !shadow-none"
            >
              Raw JSON
            </TabsTrigger_Shadcn_>
          </TabsList_Shadcn_>
          <TabsContent_Shadcn_
            value="overview"
            className={cn('mt-0 flex-grow min-h-0 overflow-y-auto')}
          >
            {selectedUser && <UserOverview user={selectedUser} onDeleteSuccess={onClose} />}
          </TabsContent_Shadcn_>
          <TabsContent_Shadcn_
            value="logs"
            className={cn('mt-0 flex-grow min-h-0 overflow-y-auto')}
          >
            {selectedUser && <UserLogs user={selectedUser} />}
          </TabsContent_Shadcn_>
          <TabsContent_Shadcn_
            value="raw"
            className={cn('mt-0 flex-grow min-h-0 overflow-y-auto', PANEL_PADDING)}
          >
            <div className="flex items-center mb-2">
              <Input_Shadcn_
                autoFocus
                type="text"
                placeholder="Filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mr-2"
              />
              <Button
                type="text"
                disabled={!searchQuery}
                onClick={() => setSearchQuery('')}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
            <SimpleCodeBlock className="javascript">
              {JSON.stringify(filteredProperties, null, 2)}
            </SimpleCodeBlock>
          </TabsContent_Shadcn_>
        </Tabs_Shadcn_>
      </ResizablePanel>
    </>
  )
}
