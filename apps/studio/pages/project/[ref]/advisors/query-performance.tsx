import { useRouter } from 'next/router'
import { parseAsString, useQueryStates } from 'nuqs'

import { useParams } from 'common'
import { EnableIndexAdvisorButton } from 'components/interfaces/QueryPerformance/EnableIndexAdvisorButton'
import { useIndexAdvisorStatus } from 'components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import { QueryPerformance } from 'components/interfaces/QueryPerformance/QueryPerformance'
import {
  QUERY_PERFORMANCE_PRESET_MAP,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from 'components/interfaces/QueryPerformance/QueryPerformance.constants'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import {
  QueryPerformanceSort,
  useQueryPerformanceQuery,
} from 'components/interfaces/Reports/Reports.queries'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import type { NextPageWithLayout } from 'types'

const QueryPerformanceReport: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()

  const [{ preset: urlPreset, search: searchQuery, order, sort }] = useQueryStates({
    sort: parseAsString,
    search: parseAsString.withDefault(''),
    order: parseAsString,
    preset: parseAsString.withDefault(QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING),
  })

  const config = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const hooks = queriesFactory(config.queries, ref ?? 'default')
  const queryHitRate = hooks.queryHitRate()

  const preset = QUERY_PERFORMANCE_PRESET_MAP[urlPreset as QUERY_PERFORMANCE_REPORT_TYPES]
  const orderBy = !!sort ? ({ column: sort, order } as QueryPerformanceSort) : undefined
  const roles = router?.query?.roles ?? []

  const queryPerformanceQuery = useQueryPerformanceQuery({
    searchQuery,
    orderBy,
    preset,
    roles: typeof roles === 'string' ? [roles] : roles,
    runIndexAdvisor: isIndexAdvisorEnabled,
  })

  return (
    <div className="h-full flex flex-col">
      <FormHeader
        className="py-4 px-6 !mb-0"
        title="Query Performance"
        actions={
          <div className="flex items-center gap-2">
            <EnableIndexAdvisorButton />
            <DocsButton href="https://supabase.com/docs/guides/platform/performance#examining-query-performance" />
            <DatabaseSelector />
          </div>
        }
      />
      <QueryPerformance queryHitRate={queryHitRate} queryPerformanceQuery={queryPerformanceQuery} />
    </div>
  )
}

QueryPerformanceReport.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Query performance">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default QueryPerformanceReport
