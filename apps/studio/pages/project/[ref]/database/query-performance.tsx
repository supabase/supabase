import { useRouter } from 'next/router'

import { useParams } from 'common'
import { QueryPerformance } from 'components/interfaces/QueryPerformance/QueryPerformance'
import { QUERY_PERFORMANCE_REPORT_TYPES } from 'components/interfaces/QueryPerformance/QueryPerformance.constants'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import {
  QueryPerformanceSort,
  useQueryPerformanceQuery,
} from 'components/interfaces/Reports/Reports.queries'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'

const PRESET_MAP = {
  [QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING]: 'mostTimeConsuming',
  [QUERY_PERFORMANCE_REPORT_TYPES.MOST_FREQUENT]: 'mostFrequentlyInvoked',
  [QUERY_PERFORMANCE_REPORT_TYPES.SLOWEST_EXECUTION]: 'slowestExecutionTime',
} as const

const QueryPerformanceReport: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef, search, sort, order, preset: urlPreset } = useParams()

  const config = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const hooks = queriesFactory(config.queries, projectRef ?? 'default')
  const queryHitRate = hooks.queryHitRate()

  const orderBy = sort !== undefined ? ({ column: sort, order } as QueryPerformanceSort) : undefined
  const searchQuery = search ?? ''
  const roles = router?.query?.roles ?? []
  const preset =
    urlPreset !== undefined
      ? PRESET_MAP[urlPreset as QUERY_PERFORMANCE_REPORT_TYPES]
      : 'mostTimeConsuming'

  const queryPerformanceQuery = useQueryPerformanceQuery({
    searchQuery,
    orderBy,
    preset,
    roles: typeof roles === 'string' ? [roles] : roles,
  })

  return (
    <div className="h-full flex flex-col">
      <FormHeader
        className="py-4 px-6 !mb-0"
        title="Query Performance"
        docsUrl="https://supabase.com/docs/guides/platform/performance#examining-query-performance"
        actions={<DatabaseSelector />}
      />
      <QueryPerformance queryHitRate={queryHitRate} queryPerformanceQuery={queryPerformanceQuery} />
    </div>
  )
}

QueryPerformanceReport.getLayout = (page) => (
  <DatabaseLayout title="Query performance">{page}</DatabaseLayout>
)

export default QueryPerformanceReport
