import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { getReadReplicaPath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

/** @deprecated Redirects to Settings → Infrastructure replica detail. */
const DatabaseReadReplicaRedirectPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, replicaId } = useParams()

  useEffect(() => {
    if (!ref || !replicaId) return
    router.replace(getReadReplicaPath(ref, replicaId))
  }, [ref, replicaId, router])

  return (
    <div className="p-6">
      <GenericSkeletonLoader />
    </div>
  )
}

DatabaseReadReplicaRedirectPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Replication">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReadReplicaRedirectPage
