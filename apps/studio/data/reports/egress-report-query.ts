import { FeatureFlagContext, useFlag } from 'common'
import dayjs from 'dayjs'
import { useContext } from 'react'

import { PRESET_CONFIG } from '@/components/interfaces/Reports/Reports.constants'
import { getLogsSql } from '@/components/interfaces/Reports/Reports.utils'
import { useLogsQuery } from '@/hooks/analytics/useLogsQuery'

/**
 * Top request paths for one project, ranked by response bytes over the last 24 hours
 * (the longest window that every plan's log retention covers).
 */
export const useEgressReport = (projectRef: string) => {
  const useOtel = useFlag('otelReports')
  const { hasLoaded } = useContext(FeatureFlagContext)
  // Rounded to the hour so the query key (and URL) stays stable: re-expanding reuses the cache
  // instead of refetching, and a millisecond timestamp would change on every render.
  const isoTimestampStart = dayjs().subtract(1, 'day').startOf('hour').toISOString()

  return useLogsQuery({
    projectRef,
    enabled: hasLoaded,
    initialParams: {
      sql: getLogsSql(PRESET_CONFIG.api.queries.egressTopPaths, [], useOtel),
      iso_timestamp_start: isoTimestampStart,
    },
    options: { useOtel },
  })
}
