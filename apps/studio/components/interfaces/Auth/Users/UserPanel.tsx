import { useFlag } from 'common'
import { XIcon } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import {
  Button,
  cn,
  ResizableHandle,
  ResizablePanel,
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { UserCard } from './UserCard'
import { UserLogs } from './UserLogs'
import { UserOverview } from './UserOverview'
import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { UserRecentLogs } from '@/components/interfaces/UnifiedLogs/components/UserRecentLogs'
import { RawJsonView } from '@/components/ui/RawJsonView'
import { useUserQuery } from '@/data/auth/user-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

type UserPanelView = 'overview' | 'raw' | 'logs' | 'recent-logs'

export const UserPanel = () => {
  const { data: project } = useSelectedProjectQuery()
  const showLogs = useIsFeatureEnabled('logs:all')
  // Recent logs read unified logs filtered by user, which only the ClickHouse path supports
  const isOtelUnifiedLogs = !!useFlag('otelUnifiedLogs')
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()
  const showRecentLogs = showLogs && isOtelUnifiedLogs && isUnifiedLogsEnabled

  const [selectedId, setSelectedId] = useQueryState(
    'show',
    parseAsString.withOptions({ history: 'push', clearOnDefault: true })
  )

  const [view, setView] = useState<UserPanelView>('overview')

  const { data: selectedUser, isPending } = useUserQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    userId: selectedId,
  })

  return (
    <>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="35" maxSize="45" minSize="35" className="bg-studio border-t">
        {!selectedUser && (
          <Button
            variant="text"
            className="absolute top-3 right-3 z-10 px-1"
            icon={<XIcon />}
            aria-label="Close panel"
            onClick={() => setSelectedId(null)}
          />
        )}
        <Tabs
          value={view}
          className="flex flex-col h-full"
          onValueChange={(value) => {
            if (
              value === 'overview' ||
              value === 'raw' ||
              value === 'logs' ||
              value === 'recent-logs'
            )
              setView(value)
          }}
        >
          {isPending ? (
            <div>
              <div className="min-h-[46px] border-b" />
              <div className="p-4">
                <GenericSkeletonLoader />
              </div>
            </div>
          ) : !!selectedUser ? (
            <>
              <UserCard
                user={selectedUser}
                className="pb-3"
                actions={
                  <Button
                    variant="text"
                    className="px-1"
                    icon={<XIcon />}
                    aria-label="Close panel"
                    onClick={() => setSelectedId(null)}
                  />
                }
              />
              <TabsList className="shrink-0 gap-x-4 px-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {showLogs && !showRecentLogs && <TabsTrigger value="logs">Logs</TabsTrigger>}
                <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                {showRecentLogs && <TabsTrigger value="recent-logs">Logs</TabsTrigger>}
                <TabsIndicator />
              </TabsList>

              <TabsContent value="overview" className={cn('mt-0 grow min-h-0 overflow-y-auto')}>
                {selectedUser && (
                  <UserOverview user={selectedUser} onDeleteSuccess={() => setSelectedId(null)} />
                )}
              </TabsContent>
              {showRecentLogs && selectedUser.id && (
                <TabsContent
                  value="recent-logs"
                  className={cn('mt-0 grow min-h-0 overflow-y-auto')}
                >
                  <UserRecentLogs userId={selectedUser.id} />
                </TabsContent>
              )}
              {showLogs && !showRecentLogs && (
                <TabsContent value="logs" className={cn('mt-0 grow min-h-0 overflow-y-auto')}>
                  {selectedUser && <UserLogs user={selectedUser} />}
                </TabsContent>
              )}
              <TabsContent value="raw" className="mt-0 grow min-h-0 overflow-y-auto">
                <RawJsonView data={selectedUser} copyLabel="Copy user as JSON" />
              </TabsContent>
            </>
          ) : (
            <div className="flex items-center justify-center w-full h-full flex-col gap-y-2">
              <p className="text-foreground-light text-sm">
                Unable to find user with the following ID in project
              </p>
              <p className="text-foreground-lighter text-xs">ID: {selectedId}</p>
            </div>
          )}
        </Tabs>
      </ResizablePanel>
    </>
  )
}
