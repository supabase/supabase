import { Admonition, cn, Separator } from 'ui'
import { PANEL_PADDING } from './UserPanel'
import { User } from 'data/auth/users-query'
import { UserHeader } from './UserHeader'
import useLogsPreview from 'hooks/analytics/useLogsPreview'
import { useParams } from 'common'
import { LOGS_TABLES } from 'components/interfaces/Settings/Logs/Logs.constants'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'

interface UserLogsProps {
  user: User
}

export const UserLogs = ({ user }: UserLogsProps) => {
  const { ref } = useParams()
  const { logData: authLogs, isLoading: isLoadingAuthLogs } = useLogsPreview(
    ref as string,
    LOGS_TABLES.auth,
    {
      'metadata.user_id': user.id,
    }
  )
  console.log({ authLogs })

  return (
    <div>
      <UserHeader user={user} />

      <Separator />

      <div className={cn('flex flex-col gap-y-3', PANEL_PADDING)}>
        <div>
          <p>Authentication logs</p>
          <p className="text-sm text-foreground-light">
            Latest logs from authentication for this user
          </p>
        </div>
        {isLoadingAuthLogs ? (
          <GenericSkeletonLoader />
        ) : authLogs.length === 0 ? (
          <Admonition
            type="note"
            title="No authentication logs available for this user"
            description="Auth events such as logging in will be shown here"
          />
        ) : (
          <div>Hello</div>
        )}
      </div>

      {/* <Separator /> */}

      {/* <div className={cn('flex flex-col', PANEL_PADDING)}>
        <p>Postgrest logs</p>
        <p className="text-sm text-foreground-light">
          Latest logs from using client libraries for this user
        </p>
      </div> */}
    </div>
  )
}
