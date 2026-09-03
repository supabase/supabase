import { X } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { Button, cn, Input, Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { SimpleCodeBlock } from 'ui-patterns/SimpleCodeBlock'

import { UserLogs } from './UserLogs'
import { UserOverview } from './UserOverview'
import { PANEL_PADDING } from './Users.constants'
import { useUserQuery } from '@/data/auth/user-query'
import { User } from '@/data/auth/users-infinite-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const UserPanel = () => {
  const { data: project } = useSelectedProjectQuery()
  const showLogs = useIsFeatureEnabled('logs:all')

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
    <div className="relative h-full bg-studio">
      <Button
        variant="text"
        className="absolute top-3 right-3 z-10 px-1"
        icon={<X />}
        aria-label="Close user details"
        onClick={() => setSelectedId(null)}
      />
      <Tabs
        value={view}
        className="flex h-full flex-col"
        onValueChange={(value) => setView(value as 'overview' | 'raw' | 'logs')}
      >
        {isPending ? (
          <div>
            <div className="min-h-[46px] border-b" />
            <div className="p-5">
              <GenericSkeletonLoader />
            </div>
          </div>
        ) : selectedUser ? (
          <>
            <TabsList className="flex min-h-[46px] gap-x-4 px-5 pr-12">
              <TabsTrigger
                value="overview"
                className="h-full px-0 pb-0 text-xs shadow-none! data-[state=active]:bg-transparent"
              >
                Overview
              </TabsTrigger>
              {showLogs && (
                <TabsTrigger
                  value="logs"
                  className="h-full px-0 pb-0 text-xs shadow-none! data-[state=active]:bg-transparent"
                >
                  Logs
                </TabsTrigger>
              )}
              <TabsTrigger
                value="raw"
                className="h-full px-0 pb-0 text-xs shadow-none! data-[state=active]:bg-transparent"
              >
                Raw JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0 grow min-h-0 overflow-y-auto">
              <UserOverview user={selectedUser} onDeleteSuccess={() => setSelectedId(null)} />
            </TabsContent>
            {showLogs && (
              <TabsContent value="logs" className="mt-0 grow min-h-0 overflow-y-auto">
                <UserLogs user={selectedUser} />
              </TabsContent>
            )}
            <TabsContent
              value="raw"
              className={cn('mt-0 grow min-h-0 overflow-y-auto', PANEL_PADDING)}
            >
              <div className="mb-2 flex items-center">
                <Input
                  autoFocus
                  type="text"
                  placeholder="Filter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mr-2"
                />
                <Button
                  variant="text"
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
            </TabsContent>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-y-2 px-5 text-center">
            <p className="text-foreground-light text-sm">
              Unable to find user with the following ID in project
            </p>
            <p className="text-foreground-lighter break-all text-xs">ID: {selectedId}</p>
          </div>
        )}
      </Tabs>
    </div>
  )
}
