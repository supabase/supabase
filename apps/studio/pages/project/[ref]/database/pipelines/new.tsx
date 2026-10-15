import { useFeatureFlags, useParams } from 'common'
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

const PipelineCreationPage = () => {
  const { ref } = useParams()
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
  if (isAccessLoading) return <GenericSkeletonLoader />
  if (!canOpenFlow) return <p role="status">Returning to Pipelines…</p>
  return (
    <>
      <Head>
        <title>New pipeline | Supabase</title>
      </Head>
      <PipelineCreationFlow
        availableDestinations={[
          ...(bigQuery ? ['BigQuery' as const] : []),
          ...(duckLake ? ['DuckLake' as const] : []),
          ...(snowflake ? ['Snowflake' as const] : []),
          ...(clickHouse ? ['ClickHouse' as const] : []),
        ]}
        onClose={() => window.location.assign(listHref)}
      />
    </>
  )
}

export default withAuth(PipelineCreationPage)
