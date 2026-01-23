import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { prefetchCronJobRunDetailsEstimate } from 'data/database-cron-jobs/database-cron-job-run-details-estimate-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useStaticEffectEvent } from 'hooks/useStaticEffectEvent'

/**
 * Prefetches the cron job run details estimate when on a Cron integration page.
 * This avoids a query waterfall when navigating to the Jobs tab, since the
 * Jobs tab gates loading cron jobs on this estimate query completing first.
 */
export function useCronJobsEstimatePrefetch(integrationId: string | undefined) {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()

  const prefetch = useStaticEffectEvent(() => {
    prefetchCronJobRunDetailsEstimate(queryClient, {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    })
  })

  useEffect(() => {
    if (integrationId === 'cron' && project?.ref) {
      prefetch()
    }
  }, [integrationId, project?.ref, prefetch])
}
