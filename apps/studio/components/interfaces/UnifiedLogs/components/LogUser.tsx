import { useQuery } from '@tanstack/react-query'
import { useFlag, useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import { Skeleton } from 'ui'

import { ColumnSchema } from '../UnifiedLogs.schema'
import { getLogTypeSource, getRowTimestampMs } from '../UnifiedLogs.utils'
import { LogFieldRow } from './LogFieldRow'
import { resolveRequestUser } from './LogUser.utils'
import { UserCard } from '@/components/interfaces/Auth/Users/UserCard'
import { UserFields } from '@/components/interfaces/Auth/Users/UserFields'
import { AlertError } from '@/components/ui/AlertError'
import { useUserQuery } from '@/data/auth/user-query'
import { unifiedLogRequestTimelineQueryOptions } from '@/data/logs/unified-log-request-timeline-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

/** The Supabase user behind a log's request, when one can be found. */
export function LogUser({ row }: { row: ColumnSchema }) {
  const { ref: projectRef } = useParams()
  const isOtel = !!useFlag('otelUnifiedLogs')

  // Only logs without their own user need the rest of the request to find one
  const timelineQuery = unifiedLogRequestTimelineQueryOptions({
    projectRef,
    logId: row.id,
    source: getLogTypeSource(row.log_type),
    logTimestampMs: getRowTimestampMs(row),
  })
  const { data: timeline, isLoading: isLoadingTimeline } = useQuery({
    ...timelineQuery,
    enabled: isOtel && !row.auth_user && timelineQuery.enabled,
  })

  if (isLoadingTimeline) return <LogUserSkeleton />

  const requestUser = resolveRequestUser(row, timeline?.logs)

  if (requestUser.kind === 'none') {
    return (
      <div className="flex flex-col gap-1 p-4 text-sm">
        <p className="text-foreground-light">No signed-in user</p>
        <p className="text-foreground-lighter">
          {requestUser.role
            ? `This request used the ${requestUser.role} role rather than a user's access token.`
            : "Only API Gateway requests made with a user's access token, and Auth events, are linked to a user."}
        </p>
      </div>
    )
  }

  if (requestUser.kind === 'external') {
    return (
      <div className="py-2">
        <p className="px-4 py-2 text-sm text-foreground-lighter">
          This subject isn&apos;t a Supabase Auth user, so it may come from a third-party auth
          provider.
        </p>
        <UserIdRow label="Subject" userId={requestUser.userId} />
      </div>
    )
  }

  return <SupabaseUser userId={requestUser.userId} />
}

function SupabaseUser({ userId }: { userId: string }) {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [, setUserFilter] = useQueryState('user', parseAsString)
  const {
    data: user,
    error,
    isPending,
    isError,
  } = useUserQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    userId,
  })

  if (isPending) return <LogUserSkeleton />

  if (isError) {
    return (
      <AlertError
        error={error}
        subject="Failed to retrieve user"
        projectRef={project?.ref}
        className="m-4"
      />
    )
  }

  if (!user) {
    return (
      <div className="py-2">
        <div className="flex flex-col gap-1 px-4 py-2 text-sm">
          <p className="text-foreground-light">User not found</p>
          <p className="text-foreground-lighter">
            No user with this ID exists. They may have been deleted.
          </p>
        </div>
        <UserIdRow label="User ID" userId={userId} />
      </div>
    )
  }

  return (
    <>
      <UserCard
        user={user}
        variant="outline"
        href={`/project/${projectRef}/auth/users?show=${userId}`}
        linkLabel="Open in Authentication"
        className="mx-4 mb-1 mt-3"
      />
      <UserFields user={user} onFilterByUser={() => setUserFilter(userId)} />
    </>
  )
}

/** A user ID that can be copied, or used to filter the list like the sidebar's user filter. */
function UserIdRow({ label, userId }: { label: string; userId: string }) {
  const [, setUserFilter] = useQueryState('user', parseAsString)
  return (
    <LogFieldRow
      label={label}
      value={userId}
      filterFields={[]}
      onAddFilter={() => setUserFilter(userId)}
    />
  )
}

const LogUserSkeleton = () => (
  <div className="flex flex-col gap-3 p-4" aria-label="Loading user">
    {[0, 1, 2].map((i) => (
      <Skeleton key={i} className="h-5 w-full" />
    ))}
  </div>
)
