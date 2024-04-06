import { HelpCircle } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { executeSql } from 'data/sql/execute-sql-query'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import {
  Button,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import ConfirmModal from 'ui-patterns/Dialogs/ConfirmDialog'
import { Markdown } from '../Markdown'
import { QueryPerformanceFilterBar } from '../QueryPerformance/QueryPerformanceFilterBar'
import { PresetHookResult } from '../Reports/Reports.utils'
import { QUERY_PERFORMANCE_REPORT_TYPES } from './QueryPerformance.constants'
import { QueryPerformanceGrid } from './QueryPerformanceGrid'
import { useRouter } from 'next/router'
import { useParams } from 'common'

interface QueryPerformanceProps {
  queryHitRate: PresetHookResult
  queryPerformanceQuery: DbQueryHook<any>
}

const QUERY_PERFORMANCE_TABS = [
  {
    id: QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING,
    label: 'Time Consuming',
    description: 'Lists queries ordered by their cumulative total execution time.',
  },
  {
    id: QUERY_PERFORMANCE_REPORT_TYPES.MOST_FREQUENT,
    label: 'Most frequent',
    description: 'Lists queries in order of their execution count',
  },
  {
    id: QUERY_PERFORMANCE_REPORT_TYPES.SLOWEST_EXECUTION,
    label: 'Slowest execution',
    description: 'Lists queries ordered by their maximum execution time',
  },
]

export const QueryPerformance = ({
  queryHitRate,
  queryPerformanceQuery,
}: QueryPerformanceProps) => {
  const router = useRouter()
  const { preset } = useParams()
  const { project } = useProjectContext()
  const [page, setPage] = useState<
    | QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING
    | QUERY_PERFORMANCE_REPORT_TYPES.MOST_FREQUENT
    | QUERY_PERFORMANCE_REPORT_TYPES.SLOWEST_EXECUTION
  >(
    (preset as QUERY_PERFORMANCE_REPORT_TYPES) ?? QUERY_PERFORMANCE_REPORT_TYPES.MOST_TIME_CONSUMING
  )
  const [showResetgPgStatStatements, setShowResetgPgStatStatements] = useState(false)

  const isLoading = [queryPerformanceQuery.isLoading, queryHitRate.isLoading].every(
    (value) => value
  )

  const handleRefresh = async () => {
    queryPerformanceQuery.runQuery()
    queryHitRate.runQuery()
  }

  return (
    <>
      <Tabs_Shadcn_
        defaultValue={page}
        onValueChange={(value) => {
          setPage(value as QUERY_PERFORMANCE_REPORT_TYPES)
          const { sort, search, ...rest } = router.query
          router.push({ ...router, query: { ...rest, preset: value } })
        }}
      >
        <TabsList_Shadcn_ className={cn('flex gap-0 border-0 items-end')}>
          {QUERY_PERFORMANCE_TABS.map((tab) => (
            <TabsTrigger_Shadcn_
              key={tab.id}
              value={tab.id}
              className={cn(
                'px-6 py-3 border-b-0 flex flex-col items-start !shadow-none border-strong border-t',
                'even:border-x last:border-r even:!border-x-strong last:!border-r-strong',
                tab.id === page ? '!bg-surface-200' : '!bg-surface-100'
              )}
            >
              <div className="flex items-center gap-x-2">
                <p>{tab.label}</p>
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>
                    <HelpCircle
                      size={14}
                      className="text-foreground-light hover:text-foreground transition"
                    />
                  </TooltipTrigger_Shadcn_>
                  <TooltipContent_Shadcn_ side="bottom">{tab.description}</TooltipContent_Shadcn_>
                </Tooltip_Shadcn_>
              </div>
              <p className="text-xs text-foreground-lighter">No data yet</p>
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>
      </Tabs_Shadcn_>

      <div className="px-6 py-3 bg-surface-200">
        <QueryPerformanceFilterBar onRefreshClick={handleRefresh} isLoading={isLoading} />
      </div>

      <QueryPerformanceGrid queryPerformanceQuery={queryPerformanceQuery} />

      <div className="px-6 py-6 flex gap-x-4 border-t">
        <div className="w-[35%] flex flex-col gap-y-1 text-sm">
          <p>Reset report</p>
          <p className="text-xs text-foreground-light">
            Consider resetting the analysis after optimizing any queries
          </p>
          <Button
            type="default"
            className="!mt-3 w-min"
            onClick={() => setShowResetgPgStatStatements(true)}
          >
            Reset report
          </Button>
        </div>
        <div className="w-[35%] flex flex-col gap-y-1 text-sm">
          <p>How is this report generated?</p>
          <Markdown
            className="text-xs"
            content="This report uses the pg_stat_statements table, and pg_stat_statements extension. [Learn more here](https://supabase.com/docs/guides/platform/performance#examining-query-performance)."
          />
        </div>
      </div>

      <ConfirmModal
        danger
        visible={showResetgPgStatStatements}
        title="Reset query performance analysis"
        description={
          'This will reset the `extensions.pg_stat_statements` table that is used to calculate query performance. This data will repopulate immediately after.'
        }
        buttonLabel="Clear table"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => setShowResetgPgStatStatements(false)}
        onSelectConfirm={async () => {
          try {
            await executeSql({
              projectRef: project?.ref,
              connectionString: project?.connectionString,
              sql: `SELECT pg_stat_statements_reset();`,
            })
            handleRefresh()
            setShowResetgPgStatStatements(false)
          } catch (error: any) {
            toast.error(`Failed to reset analysis: ${error.message}`)
          }
        }}
      />
    </>
  )
}
