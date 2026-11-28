import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useFeatureFlags, useParams } from 'common'
import { useEffect } from 'react'
import { Button } from 'ui'

import { usePipelineCreationPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { PipelineCreationFlow } from '@/components/interfaces/Database/Replication/CreatePipeline/PipelineCreationFlow'
import { PipelineCreationHeader } from '@/components/interfaces/Database/Replication/CreatePipeline/PipelineCreationHeader'
import { PipelineCreationSkeleton } from '@/components/interfaces/Database/Replication/CreatePipeline/PipelineCreationSkeleton'
import { usePipelineCreationSourceAvailability } from '@/components/interfaces/Database/Replication/CreatePipeline/usePipelineCreationSourceAvailability'
import {
  useIsPipelinesBigQueryEnabled,
  useIsPipelinesClickHouseEnabled,
  useIsPipelinesDuckLakeEnabled,
  useIsPipelinesSnowflakeEnabled,
} from '@/components/interfaces/Database/Replication/useIsPipelinesEnabled'
import { AlertError } from '@/components/ui/AlertError'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { withAuth } from '@/hooks/misc/withAuth'
import { isAbsoluteUrl, splitInternalUrl } from '@/lib/internal-url'

export const Route = createFileRoute('/project/$ref/database/pipelines/new')({
  staticData: { skipProjectLayout: true, skipDatabaseLayout: true },
  component: PipelineCreationRoute,
})

const PipelineCreationPageWithAuth = withAuth(PipelineCreationPage)

function PipelineCreationRoute() {
  return <PipelineCreationPageWithAuth />
}

function PipelineCreationPage() {
  const { ref } = useParams()
  const navigate = useNavigate()
  const { hasLoaded } = useFeatureFlags()
  const { isPending: isOrganizationPending } = useSelectedOrganizationQuery()
  const { isEnabled, isLoading } = usePipelineCreationPreview()
  const { isHighAvailability, isPending } = useHighAvailability()
  const canUseReplication = useIsFeatureEnabled('database:replication')
  const bigQuery = useIsPipelinesBigQueryEnabled()
  const duckLake = useIsPipelinesDuckLakeEnabled()
  const snowflake = useIsPipelinesSnowflakeEnabled()
  const clickHouse = useIsPipelinesClickHouseEnabled()
  const isProjectAccessLoading =
    isLoading || (isEnabled && (!hasLoaded || isOrganizationPending || isPending))
  const canAccessFlow = isEnabled && !isHighAvailability && canUseReplication
  const {
    hasSource,
    isPending: isSourceAvailabilityPending,
    error: sourceAvailabilityError,
    retry: retrySourceAvailability,
  } = usePipelineCreationSourceAvailability({
    projectRef: ref,
    enabled: !!ref && !isProjectAccessLoading && canAccessFlow,
  })
  const isAccessLoading = !ref || isProjectAccessLoading || isSourceAvailabilityPending
  const canOpenFlow = canAccessFlow && hasSource
  useEffect(() => {
    if (!isAccessLoading && !canOpenFlow && !sourceAvailabilityError && ref) {
      void navigate({
        to: '/project/$ref/database/pipelines',
        params: { ref },
        search: isEnabled ? undefined : { destinationType: 'BigQuery' },
        replace: true,
      })
    }
  }, [isAccessLoading, canOpenFlow, sourceAvailabilityError, isEnabled, ref, navigate])
  const handleClose = () => {
    if (!ref) return
    void navigate({
      to: '/project/$ref/database/pipelines',
      params: { ref },
    })
  }
  // header links resolve to absolute URLs: keep same-app ones as client-side navigations
  const handleNavigate = (href: string) => {
    const { to, search, hash } = splitInternalUrl(href)
    if (isAbsoluteUrl(to)) {
      void navigate({ href: to })
      return
    }
    void navigate({ to, search: search ?? {}, hash: hash ?? '' })
  }

  let statusMessage = 'Pipeline creation ready'
  if (isAccessLoading) statusMessage = 'Loading pipeline creation…'
  else if (sourceAvailabilityError) statusMessage = 'Pipeline sources unavailable'
  else if (!canOpenFlow) statusMessage = 'Opening Pipelines…'
  const status = (
    <p role="status" aria-label="Pipeline creation status" className="sr-only">
      {statusMessage}
    </p>
  )

  if (isAccessLoading || !canOpenFlow) {
    return (
      <>
        {status}
        <div className="flex min-h-screen flex-col bg-dash-sidebar">
          <title>New Pipeline | Supabase</title>
          <PipelineCreationHeader onClose={handleClose} onNavigate={handleNavigate} />
          <main className="flex-1">
            {isAccessLoading && <PipelineCreationSkeleton />}
            {sourceAvailabilityError && (
              <div className="mx-auto w-full max-w-[760px] px-6 py-8">
                <AlertError
                  error={sourceAvailabilityError}
                  subject="Failed to retrieve pipeline sources"
                  projectRef={ref}
                  additionalActions={
                    <Button onClick={() => void retrySourceAvailability()}>Retry</Button>
                  }
                />
              </div>
            )}
            {!isAccessLoading && !sourceAvailabilityError && (
              <p className="mx-auto w-full max-w-[760px] px-6 py-8">Returning to Pipelines…</p>
            )}
          </main>
        </div>
      </>
    )
  }
  return (
    <>
      {status}
      <title>New Pipeline | Supabase</title>
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
