import { SimpleCodeBlock } from '@ui/components/SimpleCodeBlock'
import { User } from 'data/auth/users-query'
import { X } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  cn,
  ResizableHandle,
  ResizablePanel,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { UserOverview } from './UserOverview'
import { UserLogs } from './UserLogs'

interface UserPanelProps {
  selectedUser?: User
  onClose: () => void
}

export const PANEL_PADDING = 'px-5 py-5'

export const UserPanel = ({ selectedUser, onClose }: UserPanelProps) => {
  const [view, setView] = useState<'overview' | 'raw' | 'logs'>('overview')

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
            <SimpleCodeBlock className="javascript">
              {JSON.stringify(selectedUser, null, 2)}
            </SimpleCodeBlock>
          </TabsContent_Shadcn_>
        </Tabs_Shadcn_>
      </ResizablePanel>
    </>
  )
}
