import { useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect } from 'react'

import { getAddReadReplicaPath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { navigateToUrl } from '@/lib/navigation'

const LEGACY_READ_REPLICA_DESTINATION_TYPE = 'Read Replica'

/**
 * Bookmarks and old CTAs used `/database/replication?destinationType=Read+Replica`.
 * That type no longer exists on this page; send those users to Infrastructure.
 */
export const useRedirectLegacyReadReplicaDestination = () => {
  const navigate = useNavigate()
  const { ref: projectRef, destinationType } = useParams()
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  useEffect(() => {
    if (!infrastructureReadReplicas || !projectRef) return
    if (destinationType !== LEGACY_READ_REPLICA_DESTINATION_TYPE) return

    void navigateToUrl(navigate, getAddReadReplicaPath(projectRef), { replace: true })
  }, [destinationType, infrastructureReadReplicas, navigate, projectRef])
}
