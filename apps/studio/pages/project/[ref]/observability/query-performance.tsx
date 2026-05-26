import { useParams } from 'common'
import { parseAsArrayOf, parseAsInteger, parseAsJson, parseAsString, useQueryStates } from 'nuqs'
import { Admonition } from 'ui-patterns'

import { useIndexAdvisorStatus } from '@/components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import { useQueryPerformanceSort } from '@/components/interfaces/QueryPerformance/hooks/useQueryPerformanceSort'
import { QueryPerformance } from '@/components/interfaces/QueryPerformance/QueryPerformance'
import { type QuerySource } from '@/components/interfaces/QueryPerformance/QueryPerformance.types'
import { useQueryPerformanceInfiniteQuery } from '@/components/interfaces/QueryPerformance/useQueryPerformanceQuery'
import { PRESET_CONFIG } from '@/components/interfaces/Reports/Reports.constants'
import { Presets } from '@/components/interfaces/Reports/Reports.types'
import { queriesFactory } from '@/components/interfaces/Reports/Reports.utils'
import { NumericFilter } from '@/components/interfaces/Reports/v2/ReportsNumericFilter'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { DocsButton } from '@/components/ui/DocsButton'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const QueryPerformanceReport: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { data: project, isLoading: isLoadingProject } = useSelectedProjectQuery()
  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()
  const { sort: sortConfig } = useQueryPerformanceSort()

  const [
    {
      search: searchQuery,
      roles,
      sources,
      minCalls,
      totalTimeFilter: totalTimeFilterRaw,
      indexAdvisor,
    },
  ] = useQueryStates({
    sort: parseAsString,
    order: parseAsString,
    search: parseAsString.withDefault(''),
    roles: parseAsArrayOf(parseAsString).withDefault([]),
    sources: parseAsArrayOf(parseAsString).withDefault([]),
    minCalls: parseAsInteger,
    totalTimeFilter: parseAsJson<NumericFilter | null>((value) =>
      value === null || value === undefined ? null : (value as NumericFilter)
    ),
    indexAdvisor: parseAsString.withDefault('false'),
  })

  const totalTimeFilter = totalTimeFilterRaw ?? null

  const config = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const hooks = queriesFactory(config.queries, ref ?? 'default')
  const queryHitRate = hooks.queryHitRate()
  const queryMetrics = hooks.queryMetrics()

  const minTotalTime =
    totalTimeFilter && totalTimeFilter.operator === '>'
      ? totalTimeFilter.value
      : totalTimeFilter && totalTimeFilter.operator === '>='
        ? totalTimeFilter.value
        : undefined

  const queryPerformanceQuery = useQueryPerformanceInfiniteQuery({
    searchQuery,
    orderBy: sortConfig || undefined,
    preset: 'unified',
    roles,
    sources: sources as QuerySource[],
    runIndexAdvisor: isIndexAdvisorEnabled,
    minCalls: minCalls ?? undefined,
    minTotalTime,
    filterIndexAdvisor: indexAdvisor === 'true',
  })

  if (!isLoadingProject && !project) {
    return (
      <div className="h-full flex flex-col p-6">
        <Admonition
          type="destructive"
          title="Project not found"
          description="Unable to load project data. Please check your project reference and try again."
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="w-full mb-0 flex lg:items-center justify-between gap-4 py-4 px-6 lg:flex-row flex-col">
        <h3 className="text-foreground text-xl prose">Query Performance</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <DocsButton
            href={`${DOCS_URL}/guides/platform/performance#examining-query-performance`}
          />
          <DatabaseSelector />
        </div>
      </div>
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
    <ObservabilityLayout title="Query Performance">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default QueryPerformanceReport
