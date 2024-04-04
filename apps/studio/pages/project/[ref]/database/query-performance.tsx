import { useRouter } from 'next/router'

import { useParams } from 'common'
import { IndexEfficiencyNotice } from 'components/interfaces/QueryPerformance/IndexEfficiencyNotice'
import { QueryPerformance } from 'components/interfaces/QueryPerformance/QueryPerformance'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import { useQueryPerformanceQuery } from 'components/interfaces/Reports/Reports.queries'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms'
import { useFlag } from 'hooks'
import type { NextPageWithLayout } from 'types'

type QueryPerformancePreset = 'time' | 'frequent' | 'slowest'

const QueryPerformanceReport: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()

  const tableIndexEfficiencyEnabled = useFlag('tableIndexEfficiency')
  const config = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const hooks = queriesFactory(config.queries, projectRef ?? 'default')
  const queryHitRate = hooks.queryHitRate()

  const orderBy = (router.query.sort as 'lat_desc' | 'lat_asc') || 'lat_desc'
  const searchQuery = (router.query.search as string) || ''
  const roles = router.query.roles || []
  const presetMap = {
    time: 'mostTimeConsuming',
    frequent: 'mostFrequentlyInvoked',
    slowest: 'slowestExecutionTime',
  } as const
  const preset = presetMap[router.query.preset as QueryPerformancePreset] || 'mostTimeConsuming'

  const queryPerformanceQuery = useQueryPerformanceQuery({
    searchQuery,
    orderBy,
    preset,
    roles: typeof roles === 'string' ? [roles] : roles,
  })

  const isLoading = [queryPerformanceQuery.isLoading, queryHitRate.isLoading].every(
    (value) => value
  )

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12 flex flex-col gap-y-4">
            <FormHeader
              className="!mb-0"
              title="Query Performance"
              description="Identify queries that consume the most time and database resources via the `pg_stat_statements` table"
              docsUrl="https://supabase.com/docs/guides/platform/performance#examining-query-performance"
            />

            {tableIndexEfficiencyEnabled && <IndexEfficiencyNotice isLoading={isLoading} />}
            <QueryPerformance
              queryHitRate={queryHitRate}
              queryPerformanceQuery={queryPerformanceQuery}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}

QueryPerformanceReport.getLayout = (page) => (
  <DatabaseLayout title="Query performance">{page}</DatabaseLayout>
)

export default QueryPerformanceReport
