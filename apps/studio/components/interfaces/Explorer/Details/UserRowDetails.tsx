import { useState } from 'react'
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { GenericRowDetails } from './GenericRowDetails'
import type { RowDetailsProps } from './RowDetails'
import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { UserCard } from '@/components/interfaces/Auth/Users/UserCard'
import { UserLogs } from '@/components/interfaces/Auth/Users/UserLogs'
import { UserOverview } from '@/components/interfaces/Auth/Users/UserOverview'
import { UserRecentLogs } from '@/components/interfaces/UnifiedLogs/components/UserRecentLogs'
import { RawJsonView } from '@/components/ui/RawJsonView'
import { useUserQuery } from '@/data/auth/user-query'
import { useUnifiedLogsBackend } from '@/data/logs/unified-logs-infinite-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

type UserDetailsView = 'overview' | 'raw' | 'logs'

/**
 * A row of `auth.users` is a user, so it gets the Users page's own view of one — the same
 * card, overview and actions, logs, and raw JSON as its user panel. Actions go through the
 * Auth API rather than writing the row, which the `auth` schema doesn't allow anyway.
 */
export const UserRowDetails = (props: RowDetailsProps) => {
  const { data: project } = useSelectedProjectQuery()
  const showLogs = useIsFeatureEnabled('logs:all')
  const isOtelUnifiedLogs = useUnifiedLogsBackend()
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()
  const showRecentLogs = showLogs && isOtelUnifiedLogs && isUnifiedLogsEnabled
  const [view, setView] = useState<UserDetailsView>('overview')

  const userId = typeof props.rowIdentifiers.id === 'string' ? props.rowIdentifiers.id : undefined
  const { data: user, isPending } = useUserQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    userId,
  })

  if (isPending) {
    return (
      <div className="p-4">
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (!user) return <GenericRowDetails {...props} />

  return (
    <Tabs
      value={view}
      className="flex h-full flex-col"
      onValueChange={(value) => {
        if (value === 'overview' || value === 'raw' || value === 'logs') setView(value)
      }}
    >
      <UserCard user={user} className="pb-3" />
      <TabsList className="shrink-0 gap-x-4 px-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        {showLogs && !showRecentLogs && <TabsTrigger value="logs">Logs</TabsTrigger>}
        <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        {showRecentLogs && <TabsTrigger value="logs">Logs</TabsTrigger>}
        <TabsIndicator />
      </TabsList>
      <TabsContent value="overview" className="mt-0 min-h-0 grow">
        <UserOverview user={user} onDeleteSuccess={() => props.onRowDeleted?.()} />
      </TabsContent>
      {showLogs && (
        <TabsContent value="logs" className="mt-0 min-h-0 grow">
          {showRecentLogs && user.id ? (
            <UserRecentLogs userId={user.id} />
          ) : (
            <UserLogs user={user} />
          )}
        </TabsContent>
      )}
      <TabsContent value="raw" className="mt-0 min-h-0 grow">
        <RawJsonView data={user} copyLabel="Copy user as JSON" />
      </TabsContent>
    </Tabs>
  )
}
