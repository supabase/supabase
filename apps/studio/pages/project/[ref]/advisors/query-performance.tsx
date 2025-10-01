import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'

import { useParams } from 'common'
import { EnableIndexAdvisorButton } from 'components/interfaces/QueryPerformance/EnableIndexAdvisorButton'
import { useIndexAdvisorStatus } from 'components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import { useQueryPerformanceSort } from 'components/interfaces/QueryPerformance/hooks/useQueryPerformanceSort'
import { QueryPerformance } from 'components/interfaces/QueryPerformance/QueryPerformance'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import { useQueryPerformanceQuery } from 'components/interfaces/Reports/Reports.queries'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import AdvisorsLayout from 'components/layouts/AdvisorsLayout/AdvisorsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const QueryPerformanceReport: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()
  const { sort: sortConfig } = useQueryPerformanceSort()

  const [{ search: searchQuery, roles }] = useQueryStates({
    sort: parseAsString,
    order: parseAsString,
    search: parseAsString.withDefault(''),
    roles: parseAsArrayOf(parseAsString).withDefault([]),
  })

  const config = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const hooks = queriesFactory(config.queries, ref ?? 'default')
  const queryHitRate = hooks.queryHitRate()
  const queryMetrics = hooks.queryMetrics()

  const queryPerformanceQuery = useQueryPerformanceQuery({
    searchQuery,
    orderBy: sortConfig || undefined,
    preset: 'unified',
    roles,
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
            <DocsButton
              href={`${DOCS_URL}/guides/platform/performance#examining-query-performance`}
            />
            <DatabaseSelector />
          </div>
        }
      />
      <QueryPerformance
        queryHitRate={queryHitRate}
        queryPerformanceQuery={queryPerformanceQuery}
        queryMetrics={queryMetrics}
      />
    </div>
  )
}

QueryPerformanceReport.getLayout = (page) => (
  <DefaultLayout>
    <AdvisorsLayout title="Query performance">{page}</AdvisorsLayout>
  </DefaultLayout>
)

export default QueryPerformanceReport
