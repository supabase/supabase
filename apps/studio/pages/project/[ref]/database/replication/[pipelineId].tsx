import { FeatureFlagContext, useParams } from 'common'
import { useRouter } from 'next/router'
import { useContext, useEffect } from 'react'

import { ReplicationPipelineLayout } from '@/components/interfaces/Database/Replication/ReplicationPipelineLayout'
import { ReplicationPipelineStatus } from '@/components/interfaces/Database/Replication/ReplicationPipelineStatus/ReplicationPipelineStatus'
import { useIsETLPrivateAlpha } from '@/components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import { ReplicationLayout } from '@/components/layouts/DatabaseLayout/ReplicationLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const enablePgReplicate = useIsETLPrivateAlpha()

  useEffect(() => {
    if (hasLoaded && !enablePgReplicate) {
      router.replace(`/project/${projectRef}/database/replication`)
    }
  }, [router, hasLoaded, projectRef, enablePgReplicate])

  return (
    <>
      {enablePgReplicate && (
        <ReplicationPipelineLayout>
          <ReplicationPipelineStatus />
        </ReplicationPipelineLayout>
      )}
    </>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DefaultLayout>
    <ReplicationLayout>{page}</ReplicationLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
