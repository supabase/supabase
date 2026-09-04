import { FeatureFlagContext, useParams } from 'common'
import { useRouter } from 'next/router'
import { useContext, useEffect } from 'react'

import { PipelineFixtureController } from '@/components/interfaces/Database/Replication/PipelineFixtureController'
import { ReplicationPipelineLayout } from '@/components/interfaces/Database/Replication/ReplicationPipelineLayout'
import { ReplicationPipelineStatus } from '@/components/interfaces/Database/Replication/ReplicationPipelineStatus/ReplicationPipelineStatus'
import { useIsETLPrivateAlpha } from '@/components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
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
        <PipelineRequestStatusProvider>
          <ReplicationPipelineLayout>
            <ReplicationPipelineStatus />
          </ReplicationPipelineLayout>
          <PipelineFixtureController />
        </PipelineRequestStatusProvider>
      )}
    </>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Replication">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
