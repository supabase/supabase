import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { checkLocalETLNotSetUp } from '@/data/replication/utils'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const LocalReplicationUnavailableAdmonition = ({ className }: { className?: string }) => {
  const { ref: projectRef } = useParams()
  const { error } = useReplicationDestinationsQuery({ projectRef })
  const isLocalETLNotSetUp = checkLocalETLNotSetUp(error)
  const [isDismissed, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.REPLICATION_LOCAL_UNAVAILABLE_ADMONITION_DISMISSED,
    false
  )

  if (!isLocalETLNotSetUp || isDismissed) return null

  return (
    <Admonition
      type="warning"
      layout="horizontal"
      className={className}
      title="Replication unavailable locally"
      description="Configure the replication API to manage Pipelines destinations in local development."
      actions={
        <Button type="button" variant="default" size="tiny" onClick={() => setIsDismissed(true)}>
          Dismiss
        </Button>
      }
    />
  )
}
