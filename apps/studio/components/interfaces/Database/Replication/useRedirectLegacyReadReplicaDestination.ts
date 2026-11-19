import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { getAddReadReplicaPath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

const LEGACY_READ_REPLICA_DESTINATION_TYPE = 'Read Replica'

/**
 * Bookmarks and old CTAs used `/database/replication?destinationType=Read+Replica`.
 * That type no longer exists on this page; send those users to Infrastructure.
 */
export const useRedirectLegacyReadReplicaDestination = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  useEffect(() => {
    if (!infrastructureReadReplicas || !projectRef || !router.isReady) return

    const destinationType = router.query.destinationType
    const legacyType = Array.isArray(destinationType) ? destinationType[0] : destinationType
    if (legacyType !== LEGACY_READ_REPLICA_DESTINATION_TYPE) return

    router.replace(getAddReadReplicaPath(projectRef))
  }, [infrastructureReadReplicas, projectRef, router])
}
