import { X } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'

import { useUserQuery } from 'data/auth/user-query'
import { User } from 'data/auth/users-infinite-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
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
import { GenericSkeletonLoader } from 'ui-patterns'
import { UserLogs } from './UserLogs'
import { UserOverview } from './UserOverview'
import { PANEL_PADDING } from './Users.constants'

export const UserPanel = () => {
  const { data: project } = useSelectedProjectQuery()

  const [selectedId, setSelectedId] = useQueryState(
    'show',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )

  const [view, setView] = useState<'overview' | 'raw' | 'logs'>('overview')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: selectedUser, isPending } = useUserQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    userId: selectedId,
  })

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
      <ResizablePanel defaultSize="30" maxSize="45" minSize="30" className="bg-studio border-t">
        <Button
          type="text"
          className="absolute top-3 right-3 px-1"
          icon={<X />}
          onClick={() => setSelectedId(null)}
        />
        <Tabs_Shadcn_
          value={view}
          className="flex flex-col h-full"
          onValueChange={(value) => setView(value as 'overview' | 'raw' | 'logs')}
        >
          {isPending ? (
            <div>
              <div className="min-h-[46px] border-b" />
              <div className="p-5">
                <GenericSkeletonLoader />
              </div>
            </div>
          ) : !!selectedUser ? (
            <>
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
                {selectedUser && (
                  <UserOverview user={selectedUser} onDeleteSuccess={() => setSelectedId(null)} />
                )}
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
                <SimpleCodeBlock className="javascript" parentClassName="[&>*>span]:text-xs">
                  {JSON.stringify(filteredProperties, null, 2)}
                </SimpleCodeBlock>
              </TabsContent_Shadcn_>
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full flex-col gap-y-2">
              <p className="text-foreground-light text-sm">
                Unable to find user with the following ID in project
              </p>
              <p className="text-foreground-lighter text-xs">ID: {selectedId}</p>
            </div>
          )}
        </Tabs_Shadcn_>
      </ResizablePanel>
    </>
  )
}
