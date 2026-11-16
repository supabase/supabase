import { FeatureFlagContext, useParams } from 'common'
import { useRouter } from 'next/router'
import { useContext, useEffect } from 'react'

import { ReplicationPipelineLayout } from '@/components/interfaces/Database/Replication/ReplicationPipelineLayout'
import { ReplicationPipelineStatus } from '@/components/interfaces/Database/Replication/ReplicationPipelineStatus/ReplicationPipelineStatus'
import { useIsPipelinesEnabled } from '@/components/interfaces/Database/Replication/useIsPipelinesEnabled'
import { PipelinesLayout } from '@/components/layouts/DatabaseLayout/PipelinesLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import type { NextPageWithLayout } from '@/types'

const DatabasePipelinesPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const enablePgReplicate = useIsPipelinesEnabled()

  useEffect(() => {
    if (hasLoaded && !enablePgReplicate) {
      router.replace(`/project/${projectRef}/database/pipelines`)
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

DatabasePipelinesPage.getLayout = (page) => (
  <DefaultLayout>
    <PipelinesLayout>{page}</PipelinesLayout>
  </DefaultLayout>
)

export default DatabasePipelinesPage
