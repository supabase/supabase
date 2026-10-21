import { useFeatureFlags, useParams } from 'common'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { usePipelineCreationPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { PipelineCreationFlow } from '@/components/interfaces/Database/Replication/CreatePipeline/PipelineCreationFlow'
import { PipelineCreationHeader } from '@/components/interfaces/Database/Replication/CreatePipeline/PipelineCreationHeader'
import { PipelineCreationSkeleton } from '@/components/interfaces/Database/Replication/CreatePipeline/PipelineCreationSkeleton'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLClickHousePrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from '@/components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { withAuth } from '@/hooks/misc/withAuth'
import { BASE_PATH } from '@/lib/constants'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import type { NextPageWithLayout } from '@/types'

const PipelineCreationPage: NextPageWithLayout<Record<string, never>> = () => {
  const { ref } = useParams()
  const router = useRouter()
  const { hasLoaded } = useFeatureFlags()
  const { isPending: isOrganizationPending } = useSelectedOrganizationQuery()
  const { isEnabled, isLoading } = usePipelineCreationPreview()
  const { isHighAvailability, isPending } = useHighAvailability()
  const canUseReplication = useIsFeatureEnabled('database:replication')
  const bigQuery = useIsETLBigQueryPrivateAlpha()
  const duckLake = useIsETLDucklakePrivateAlpha()
  const snowflake = useIsETLSnowflakePrivateAlpha()
  const clickHouse = useIsETLClickHousePrivateAlpha()
  const isProjectAccessLoading =
    isLoading || (isEnabled && (!hasLoaded || isOrganizationPending || isPending))
  const canAccessFlow = isEnabled && !isHighAvailability && canUseReplication
  const sources = useReplicationSourcesQuery(
    { projectRef: ref },
    { enabled: !isProjectAccessLoading && canAccessFlow, refetchOnMount: 'always' }
  )
  const hasSource = sources.data?.sources.some((source) => source.name === ref) === true
  const listHref = `${BASE_PATH}/project/${ref}/database/pipelines`
  const isAccessLoading =
    !ref || isProjectAccessLoading || (canAccessFlow && !sources.isFetchedAfterMount)
  const canOpenFlow = canAccessFlow && sources.isSuccess && hasSource
  useEffect(() => {
    if (!isAccessLoading && !canOpenFlow) {
      const fallback = isEnabled ? listHref : `${listHref}?destinationType=BigQuery`
      window.location.replace(fallback)
    }
  }, [isAccessLoading, canOpenFlow, isEnabled, listHref])
  const handleClose = () => {
    if (!ref) return
    void router.push(`/project/${ref}/database/pipelines`)
  }

  if (isAccessLoading || !canOpenFlow) {
    return (
      <div className="flex min-h-screen flex-col bg-dash-sidebar">
        <Head>
          <title>New Pipeline | Supabase</title>
        </Head>
        <PipelineCreationHeader
          onClose={handleClose}
          onNavigate={(href) => window.location.assign(href)}
        />
        <main className="flex-1">
          {isAccessLoading && <PipelineCreationSkeleton />}
          {!isAccessLoading && (
            <p className="mx-auto w-full max-w-[760px] px-6 py-8" role="status">
              Returning to Pipelines…
            </p>
          )}
        </main>
      </div>
    )
  }
  return (
    <>
      <Head>
        <title>New Pipeline | Supabase</title>
      </Head>
      <PipelineCreationFlow
        availableDestinations={[
          ...(bigQuery ? ['BigQuery' as const] : []),
          ...(duckLake ? ['DuckLake' as const] : []),
          ...(snowflake ? ['Snowflake' as const] : []),
          ...(clickHouse ? ['ClickHouse' as const] : []),
        ]}
        onClose={handleClose}
      />
    </>
  )
}

PipelineCreationPage.getLayout = (page) => (
  <PipelineRequestStatusProvider>{page}</PipelineRequestStatusProvider>
)

export default withAuth(PipelineCreationPage)
