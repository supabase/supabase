import { useRouter } from 'next/router'

import { useParams } from 'common'
import { QueryPerformance as QueryPerformanceV1 } from 'components/interfaces/QueryPerformance/QueryPerformance'
import { QueryPerformance } from 'components/interfaces/QueryPerformanceV2/QueryPerformance'
import { QUERY_PERFORMANCE_REPORT_TYPES } from 'components/interfaces/QueryPerformanceV2/QueryPerformance.constants'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import {
  QueryPerformanceSort,
  useQueryPerformanceQuery,
} from 'components/interfaces/Reports/Reports.queries'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import { DatabaseLayout } from 'components/layouts'
import { FormHeader } from 'components/ui/Forms'
import { useFlag } from 'hooks'
import type { NextPageWithLayout } from 'types'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'

const QueryPerformanceReport: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const enableQueryPerformanceV2 = useFlag('queryPerformanceV2')

  // [Joshen] Has been false on configcat for a long time
  const tableIndexEfficiencyEnabled = useFlag('tableIndexEfficiency')
  const config = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const hooks = queriesFactory(config.queries, projectRef ?? 'default')
  const queryHitRate = hooks.queryHitRate()

  const orderBy = router.query.sort
    ? ({ column: router.query.sort, order: router.query.order } as QueryPerformanceSort)
    : undefined
  const searchQuery = (router.query.search as string) || ''
  const roles = router.query.roles || []
  const presetMap = {
    [QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING]: 'mostTimeConsuming',
    [QUERY_PERFORMANCE_REPORT_TYPES.MOST_FREQUENT]: 'mostFrequentlyInvoked',
    [QUERY_PERFORMANCE_REPORT_TYPES.SLOWEST_EXECUTION]: 'slowestExecutionTime',
  } as const
  const preset =
    presetMap[router.query.preset as QUERY_PERFORMANCE_REPORT_TYPES] || 'mostTimeConsuming'

  const queryPerformanceQuery = useQueryPerformanceQuery({
    searchQuery,
    orderBy,
    preset,
    roles: typeof roles === 'string' ? [roles] : roles,
  })

  return (
    <div className="h-full flex flex-col">
      {/* [Joshen] Need to double check what this is about and if it's still relevant */}
      {/* {tableIndexEfficiencyEnabled && <IndexEfficiencyNotice isLoading={isLoading} />} */}

      {enableQueryPerformanceV2 ? (
        <>
          <FormHeader
            className="py-4 px-6 !mb-0"
            title="Query Performance"
            docsUrl="https://supabase.com/docs/guides/platform/performance#examining-query-performance"
          />
          <QueryPerformance
            queryHitRate={queryHitRate}
            queryPerformanceQuery={queryPerformanceQuery}
          />
        </>
      ) : (
        <ScaffoldContainer>
          <ScaffoldSection className="!grid-cols-1">
            <FormHeader
              className="!mb-0"
              title="Query Performance"
              description="Identify queries that consume the most time and database resources via the `pg_stat_statements` table"
              docsUrl="https://supabase.com/docs/guides/platform/performance#examining-query-performance"
            />
            <QueryPerformanceV1
              queryHitRate={queryHitRate}
              queryPerformanceQuery={queryPerformanceQuery}
            />
          </ScaffoldSection>
        </ScaffoldContainer>
      )}
    </div>
  )
}

QueryPerformanceReport.getLayout = (page) => (
  <DatabaseLayout title="Query performance">{page}</DatabaseLayout>
)

export default QueryPerformanceReport
