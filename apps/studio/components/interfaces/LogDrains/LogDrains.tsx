import { useParams } from 'common'
import { toast } from 'sonner'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { LogDrainType } from './LogDrains.constants'
import { LogDrainsEmpty } from './LogDrainsEmpty'
import { LogDrainsList } from './LogDrainsList'
import { useDeleteLogDrainMutation } from '@/data/log-drains/delete-log-drain-mutation'
import { LogDrainData, useLogDrainsQuery } from '@/data/log-drains/log-drains-query'
import { useTestLogDrainMutation } from '@/data/log-drains/test-log-drain-mutation'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useTrack } from '@/lib/telemetry/track'

export function LogDrains({
  onNewDrainClick,
  onUpdateDrainClick: _onUpdateDrainClick,
}: {
  onNewDrainClick: (src: LogDrainType) => void
  onUpdateDrainClick: (drain: LogDrainData) => void
}) {
  const { ref } = useParams()
  const track = useTrack()
  const { hasAccess: hasAccessToLogDrains, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('log_drains')

  const {
    data: logDrains,
    isPending: isLoading,
    error,
    isError,
  } = useLogDrainsQuery({ ref }, { enabled: hasAccessToLogDrains })

  const { mutate: deleteLogDrain, isPending: isDeleting } = useDeleteLogDrainMutation({
    onError: () => {
      toast.error('Failed to delete log drain')
    },
  })

  const { mutate: testLogDrain } = useTestLogDrainMutation({
    onSuccess: () => {
      toast.success('Log drain connection test succeeded')
    },
  })

  if (isLoadingEntitlement) {
    return (
      <div>
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (!hasAccessToLogDrains) {
    return <LogDrainsEmpty />
  }

  return (
    <LogDrainsList
      logDrains={logDrains}
      isLoading={isLoading}
      isError={isError}
      error={error}
      isDeleting={isDeleting}
      onNewDrainClick={onNewDrainClick}
      onDeleteDrain={(drain) => {
        if (ref) {
          deleteLogDrain({ token: drain.token, projectRef: ref })
          track('log_drain_removed', { destination: drain.type })
        }
      }}
      onTestDrain={(drain) => {
        if (ref) {
          testLogDrain({ token: drain.token, projectRef: ref })
        }
      }}
    />
  )
}
