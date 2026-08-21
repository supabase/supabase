import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { X } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { getInfrastructurePath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

/** Shown while muscle-memory still opens Database → Replication for replicas. */
export const ReadReplicasMovedCallout = ({ className }: { className?: string }) => {
  const { ref: projectRef } = useParams()
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])
  const [isDismissed, setIsDismissed, { isSuccess: isDismissalLoaded }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.READ_REPLICAS_MOVED_CALLOUT_DISMISSED(projectRef ?? 'unknown'),
    false
  )

  if (!projectRef || !infrastructureReadReplicas || !isDismissalLoaded || isDismissed) {
    return null
  }

  return (
    <div className={className}>
      <Admonition
        type="note"
        layout="responsive"
        title="Read replicas have moved"
        description="Manage read replicas on the Infrastructure page, alongside compute and disk."
        actions={
          <>
            <Button asChild variant="default" size="tiny">
              <Link href={getInfrastructurePath(projectRef)}>Go to Infrastructure</Link>
            </Button>
            <ButtonTooltip
              icon={<X />}
              variant="text"
              className="w-6"
              tooltip={{ content: { side: 'bottom', text: 'Dismiss' } }}
              aria-label="Dismiss read replicas moved notice"
              onClick={() => setIsDismissed(true)}
            />
          </>
        }
      />
    </div>
  )
}
