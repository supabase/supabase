import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { getAddReadReplicaPath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'

export const ReadReplicasMovedCallout = () => {
  const { ref: projectRef } = useParams()

  return (
    <Admonition
      type="note"
      layout="responsive"
      title="Read replicas have moved"
      description="Read replicas are now managed on the Infrastructure page, alongside compute and disk."
      actions={
        <Button asChild variant="default" size="tiny">
          <Link href={getAddReadReplicaPath(projectRef)}>Add read replica</Link>
        </Button>
      }
    />
  )
}
