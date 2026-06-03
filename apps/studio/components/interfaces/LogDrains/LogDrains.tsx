import { useParams } from 'common'
import { toast } from 'sonner'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { LogDrainType } from './LogDrains.constants'
import { LogDrainsEmpty } from './LogDrainsEmpty'
import { LogDrainsList } from './LogDrainsList'
import { useDeleteLogDrainMutation } from '@/data/log-drains/delete-log-drain-mutation'
import { LogDrainData, useLogDrainsQuery } from '@/data/log-drains/log-drains-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useTrack } from '@/lib/telemetry/track'

/**
 * Project-scoped log drains container. Owns data fetching, the `log_drains` entitlement
 * check and the delete mutation, then renders the shared presentational `LogDrainsList`.
 */
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
    />
  )
}
