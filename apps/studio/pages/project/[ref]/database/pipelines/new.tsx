import { useRouter as useTanStackRouter } from '@tanstack/react-router'
import { useFeatureFlags, useParams } from 'common'
import { useRouter as useNextRouter } from 'next/compat/router'
import Head from 'next/head'
import { useEffect } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { usePipelineCreationPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { PipelineCreationFlow } from '@/components/interfaces/Database/Replication/CreatePipeline/PipelineCreationFlow'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLClickHousePrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from '@/components/interfaces/Database/Replication/useIsETLPrivateAlpha'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { withAuth } from '@/hooks/misc/withAuth'
import { BASE_PATH } from '@/lib/constants'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import type { NextPageWithLayout } from '@/types'

const PipelineCreationPage: NextPageWithLayout<Record<string, never>> = () => {
  const { ref } = useParams()
  const router = useTanStackRouter({ warn: false })
  const nextRouter = useNextRouter()
  const { hasLoaded } = useFeatureFlags()
  const { isPending: isOrganizationPending } = useSelectedOrganizationQuery()
  const { isEnabled, isLoading } = usePipelineCreationPreview()
  const { isHighAvailability, isPending } = useHighAvailability()
  const canUseReplication = useIsFeatureEnabled('database:replication')
  const bigQuery = useIsETLBigQueryPrivateAlpha()
  const duckLake = useIsETLDucklakePrivateAlpha()
  const snowflake = useIsETLSnowflakePrivateAlpha()
  const clickHouse = useIsETLClickHousePrivateAlpha()
  const listHref = `${BASE_PATH}/project/${ref}/database/pipelines`
  const isAccessLoading =
    isLoading || (isEnabled && (!hasLoaded || isOrganizationPending || isPending))
  const canOpenFlow = isEnabled && !isHighAvailability && canUseReplication
  useEffect(() => {
    if (!isAccessLoading && !canOpenFlow) {
      const fallback = isEnabled ? listHref : `${listHref}?destinationType=BigQuery`
      window.location.replace(fallback)
    }
  }, [isAccessLoading, canOpenFlow, isEnabled, listHref])
  if (isAccessLoading)
    return <GenericSkeletonLoader className="mx-auto w-full max-w-[760px] px-6 py-8" />
  if (!canOpenFlow) return <p role="status">Returning to Pipelines…</p>
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
        onClose={() => {
          if (!ref) return
          if (router)
            void router.navigate({ to: '/project/$ref/database/pipelines', params: { ref } })
          else void nextRouter?.push(`/project/${ref}/database/pipelines`)
        }}
      />
    </>
  )
}

PipelineCreationPage.getLayout = (page) => (
  <PipelineRequestStatusProvider>{page}</PipelineRequestStatusProvider>
)

export default withAuth(PipelineCreationPage)
