import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { getInfrastructurePath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

/** Shown while muscle-memory still opens Database → Replication for replicas. */
export const ReadReplicasMovedCallout = () => {
  const { ref: projectRef } = useParams()
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  if (!infrastructureReadReplicas) return null

  return (
    <Admonition
      type="note"
      layout="responsive"
      title="Read replicas have moved"
      description="Manage read replicas on the Infrastructure page, alongside compute and disk."
      actions={
        <Button asChild variant="default" size="tiny">
          <Link href={getInfrastructurePath(projectRef)}>Go to Infrastructure</Link>
        </Button>
      }
    />
  )
}
