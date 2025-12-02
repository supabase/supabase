import { LoadingLine, cn } from 'ui'
import { useState, useEffect, useMemo } from 'react'

import { Button } from 'ui'
import { X, RefreshCw, RotateCcw } from 'lucide-react'
import { Markdown } from '../../Markdown'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL, IS_PLATFORM } from 'lib/constants'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import { PresetHookResult } from 'components/interfaces/Reports/Reports.utils'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import { QueryPerformanceMetrics } from '../QueryPerformanceMetrics'
import { QueryPerformanceFilterBar } from '../QueryPerformanceFilterBar'
import { QueryPerformanceGrid } from '../QueryPerformanceGrid'
import { transformStatementDataToRows } from './WithStatements.utils'
import { DownloadResultsButton } from 'components/ui/DownloadResultsButton'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

interface WithStatementsProps {
  queryHitRate: PresetHookResult
  queryPerformanceQuery: DbQueryHook<any>
  queryMetrics: PresetHookResult
}

export const WithStatements = ({
  queryHitRate,
  queryPerformanceQuery,
  queryMetrics,
}: WithStatementsProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const state = useDatabaseSelectorStateSnapshot()
  const { data, isLoading, isRefetching } = queryPerformanceQuery
  const isPrimaryDatabase = state.selectedDatabaseId === ref
  const formattedDatabaseId = formatDatabaseID(state.selectedDatabaseId ?? '')

  const [showResetgPgStatStatements, setShowResetgPgStatStatements] = useState(false)

  const [showBottomSection, setShowBottomSection] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.QUERY_PERF_SHOW_BOTTOM_SECTION,
    true
  )

  const handleRefresh = () => {
    queryPerformanceQuery.runQuery()
    queryHitRate.runQuery()
    queryMetrics.runQuery()
  }

  const processedData = useMemo(() => {
    return transformStatementDataToRows(data || [])
  }, [data])

  const { data: databases } = useReadReplicasQuery({ projectRef: ref })

  useEffect(() => {
    state.setSelectedDatabaseId(ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])

  return (
    <>
      <QueryPerformanceMetrics />
      <QueryPerformanceFilterBar
        showRolesFilter={true}
        actions={
          <>
            <ButtonTooltip
              type="default"
              size="tiny"
              icon={<RefreshCw />}
              onClick={handleRefresh}
              tooltip={{ content: { side: 'top', text: 'Refresh' } }}
              className="w-[26px]"
            />
            <ButtonTooltip
              type="default"
              size="tiny"
              icon={<RotateCcw />}
              onClick={() => setShowResetgPgStatStatements(true)}
              tooltip={{ content: { side: 'top', text: 'Reset report' } }}
              className="w-[26px]"
            />

            <DownloadResultsButton
              results={processedData}
              fileName={`Supabase Query Performance Statements (${ref})`}
              align="end"
            />
          </>
        }
      />
      <LoadingLine loading={isLoading || isRefetching} />
      <QueryPerformanceGrid aggregatedData={processedData} isLoading={isLoading} />
      <div
        className={cn('px-6 py-6 flex gap-x-4 border-t relative', {
          hidden: showBottomSection === false,
        })}
      >
        <Button
          className="absolute top-1.5 right-3 px-1.5"
          type="text"
          size="tiny"
          onClick={() => setShowBottomSection(false)}
        >
          <X size="14" />
        </Button>
        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
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

        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>How is this report generated?</p>
          <Markdown
            className="text-xs"
            content={`This report uses the pg_stat_statements table, and pg_stat_statements extension. [Learn more here](${DOCS_URL}/guides/platform/performance#examining-query-performance).`}
          />
        </div>

        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>Inspect your database for potential issues</p>
          <Markdown
            className="text-xs"
            content={`The Supabase CLI comes with a range of tools to help inspect your Postgres instances for
            potential issues. [Learn more here](${DOCS_URL}/guides/database/inspect).`}
          />
        </div>
      </div>

      <ConfirmationModal
        visible={showResetgPgStatStatements}
        size="medium"
        variant="destructive"
        title="Reset query performance analysis"
        confirmLabel="Reset report"
        confirmLabelLoading="Resetting report"
        onCancel={() => setShowResetgPgStatStatements(false)}
        onConfirm={async () => {
          const connectionString = databases?.find(
            (db) => db.identifier === state.selectedDatabaseId
          )?.connectionString

          if (IS_PLATFORM && !connectionString) {
            return toast.error('Unable to run query: Connection string is missing')
          }

          try {
            await executeSql({
              projectRef: project?.ref,
              connectionString,
              sql: `SELECT pg_stat_statements_reset();`,
            })
            handleRefresh()
            setShowResetgPgStatStatements(false)
          } catch (error: any) {
            toast.error(`Failed to reset analysis: ${error.message}`)
          }
        }}
      >
        <p className="text-foreground-light text-sm">
          This will reset the pg_stat_statements table in the extensions schema on your{' '}
          <span className="text-foreground">
            {isPrimaryDatabase ? 'primary database' : `read replica (ID: ${formattedDatabaseId})`}
          </span>
          , which is used to calculate query performance. This data will repopulate immediately
          after.
        </p>
      </ConfirmationModal>
    </>
  )
}
