import { useParams } from 'common'
import { Bug } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'

import { ConnectionsReplicationSection } from './ConnectionsReplicationSection'
import { DebuggerScanSummary } from './DebuggerScanSummary'
import { LocksActivitySection } from './LocksActivitySection'
import { PerformanceSection } from './PerformanceSection'
import { StorageHealthSection } from './StorageHealthSection'
import { interpretDebuggerResults, type DebuggerCheckInput } from './triage/debugger-triage'
import { FormHeader } from '@/components/ui/Forms/FormHeader'
import { useBloatQuery } from '@/data/database/debugger/bloat-query'
import { useBlockingQuery } from '@/data/database/debugger/blocking-query'
import { useCacheHitQuery } from '@/data/database/debugger/cache-hit-query'
import { useDbStatsQuery } from '@/data/database/debugger/db-stats-query'
import { useDebuggerPreconditionsQuery } from '@/data/database/debugger/debugger-preconditions-query'
import { useIndexStatsQuery } from '@/data/database/debugger/index-stats-query'
import { useIndexUsageQuery } from '@/data/database/debugger/index-usage-query'
import { useLocksQuery } from '@/data/database/debugger/locks-query'
import { useLongRunningQueriesQuery } from '@/data/database/debugger/long-running-queries-query'
import { useReplicationSlotsQuery } from '@/data/database/debugger/replication-slots-query'
import { useRoleStatsQuery } from '@/data/database/debugger/role-stats-query'
import { useSeqScansQuery } from '@/data/database/debugger/seq-scans-query'
import { useTableRecordCountsQuery } from '@/data/database/debugger/table-record-counts-query'
import { useTableStatsQuery } from '@/data/database/debugger/table-stats-query'
import { useTrafficProfileQuery } from '@/data/database/debugger/traffic-profile-query'
import { useUnusedIndexesQuery } from '@/data/database/debugger/unused-indexes-query'
import { useVacuumStatsQuery } from '@/data/database/debugger/vacuum-stats-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

type DebuggerTab = 'locks' | 'storage' | 'performance' | 'connections'

export function Debugger() {
  const { ref } = useParams()
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  const [hasScanned, setHasScanned] = useState(false)
  const [activeTab, setActiveTab] = useState<DebuggerTab>('locks')

  const queryVars = { projectRef: ref, connectionString }
  const queryOpts = { enabled: hasScanned }

  const preconditions = useDebuggerPreconditionsQuery(queryVars)
  const hasPgStatStatements = preconditions.data?.hasPgStatStatements ?? true

  const locksQuery = useLocksQuery(queryVars, queryOpts)
  const blockingQuery = useBlockingQuery(queryVars, queryOpts)
  const longRunningQueriesQuery = useLongRunningQueriesQuery(queryVars, queryOpts)
  const bloatQuery = useBloatQuery(queryVars, queryOpts)
  const vacuumStatsQuery = useVacuumStatsQuery(queryVars, queryOpts)
  const tableStatsQuery = useTableStatsQuery(queryVars, queryOpts)
  const tableRecordCountsQuery = useTableRecordCountsQuery(queryVars, queryOpts)
  const trafficProfileQuery = useTrafficProfileQuery(queryVars, queryOpts)
  const cacheHitQuery = useCacheHitQuery(queryVars, queryOpts)
  const indexUsageQuery = useIndexUsageQuery(queryVars, queryOpts)
  const indexStatsQuery = useIndexStatsQuery(queryVars, queryOpts)
  const seqScansQuery = useSeqScansQuery(queryVars, queryOpts)
  const unusedIndexesQuery = useUnusedIndexesQuery(queryVars, queryOpts)
  const roleStatsQuery = useRoleStatsQuery(queryVars, queryOpts)
  const replicationSlotsQuery = useReplicationSlotsQuery(queryVars, queryOpts)
  const dbStatsQuery = useDbStatsQuery(queryVars, queryOpts)

  const isScanning =
    hasScanned &&
    (locksQuery.isFetching ||
      blockingQuery.isFetching ||
      longRunningQueriesQuery.isFetching ||
      bloatQuery.isFetching ||
      vacuumStatsQuery.isFetching ||
      tableStatsQuery.isFetching ||
      tableRecordCountsQuery.isFetching ||
      trafficProfileQuery.isFetching ||
      cacheHitQuery.isFetching ||
      indexUsageQuery.isFetching ||
      indexStatsQuery.isFetching ||
      seqScansQuery.isFetching ||
      unusedIndexesQuery.isFetching ||
      roleStatsQuery.isFetching ||
      replicationSlotsQuery.isFetching ||
      dbStatsQuery.isFetching)

  const hasScanResults =
    hasScanned &&
    !isScanning &&
    (locksQuery.isSuccess || blockingQuery.isSuccess || longRunningQueriesQuery.isSuccess)

  const findings = useMemo(() => {
    if (!hasScanResults) return []

    const input: DebuggerCheckInput = {
      locks: locksQuery.data ?? [],
      blocking: blockingQuery.data ?? [],
      longRunningQueries: longRunningQueriesQuery.data ?? [],
      bloat: bloatQuery.data ?? [],
      vacuumStats: vacuumStatsQuery.data ?? [],
      cacheHit: cacheHitQuery.data ?? [],
      indexUsage: indexUsageQuery.data ?? [],
      unusedIndexes: unusedIndexesQuery.data ?? [],
      seqScans: seqScansQuery.data ?? [],
      roleStats: roleStatsQuery.data ?? [],
      replicationSlots: replicationSlotsQuery.data ?? [],
    }

    return interpretDebuggerResults(input)
  }, [
    hasScanResults,
    locksQuery.data,
    blockingQuery.data,
    longRunningQueriesQuery.data,
    bloatQuery.data,
    vacuumStatsQuery.data,
    cacheHitQuery.data,
    indexUsageQuery.data,
    unusedIndexesQuery.data,
    seqScansQuery.data,
    roleStatsQuery.data,
    replicationSlotsQuery.data,
  ])

  function handleRunScan() {
    track('debugger_scan_button_clicked')
    setHasScanned(true)
  }

  return (
    <div className="h-full flex flex-col">
      <FormHeader
        className="py-4 px-6 mb-0!"
        title="Database Debugger"
        description="Run a health scan to diagnose issues with locks, storage, performance, and connections."
        actions={
          <Button
            type="primary"
            icon={<Bug size={14} />}
            loading={isScanning}
            disabled={isScanning}
            onClick={handleRunScan}
          >
            {hasScanned ? 'Re-run scan' : 'Run scan'}
          </Button>
        }
      />

      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {preconditions.isSuccess && !hasPgStatStatements && (
          <Alert variant="warning">
            <AlertTitle>pg_stat_statements is not enabled</AlertTitle>
            <AlertDescription>
              Cache hit rates and index usage checks require the <code>pg_stat_statements</code>{' '}
              extension. Enable it via <strong>Database &rarr; Extensions</strong> to get full
              coverage. Other checks will still run.
            </AlertDescription>
          </Alert>
        )}

        {preconditions.isSuccess && !preconditions.data?.canReadStats && (
          <Alert variant="warning">
            <AlertTitle>Limited access to system views</AlertTitle>
            <AlertDescription>
              The current role may not have permission to read <code>pg_stat_activity</code> or{' '}
              <code>pg_locks</code>. Some checks may return empty results.
            </AlertDescription>
          </Alert>
        )}

        {!hasScanned && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Bug size={32} className="text-foreground-muted" strokeWidth={1.5} />
            <p className="text-foreground font-medium">No scan results yet</p>
            <p className="text-sm text-foreground-light max-w-sm">
              Click <strong>Run scan</strong> to inspect your database for locks, bloat, slow
              queries, and connection issues. Queries run against your production database.
            </p>
          </div>
        )}

        {hasScanResults && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-foreground">Scan Summary</h4>
            <DebuggerScanSummary findings={findings} />
          </div>
        )}

        {hasScanned && (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as DebuggerTab)}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="locks">Locks &amp; Activity</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
            </TabsList>

            <TabsContent value="locks">
              <LocksActivitySection
                locksData={locksQuery.data}
                blockingData={blockingQuery.data}
                longRunningQueriesData={longRunningQueriesQuery.data}
                isLocksLoading={locksQuery.isFetching}
                isBlockingLoading={blockingQuery.isFetching}
                isLongRunningQueriesLoading={longRunningQueriesQuery.isFetching}
                isLocksError={locksQuery.isError}
                isBlockingError={blockingQuery.isError}
                isLongRunningQueriesError={longRunningQueriesQuery.isError}
              />
            </TabsContent>

            <TabsContent value="storage">
              <StorageHealthSection
                bloatData={bloatQuery.data}
                vacuumStatsData={vacuumStatsQuery.data}
                tableStatsData={tableStatsQuery.data}
                tableRecordCountsData={tableRecordCountsQuery.data}
                trafficProfileData={trafficProfileQuery.data}
                isBloatLoading={bloatQuery.isFetching}
                isVacuumStatsLoading={vacuumStatsQuery.isFetching}
                isTableStatsLoading={tableStatsQuery.isFetching}
                isTableRecordCountsLoading={tableRecordCountsQuery.isFetching}
                isTrafficProfileLoading={trafficProfileQuery.isFetching}
              />
            </TabsContent>

            <TabsContent value="performance">
              <PerformanceSection
                cacheHitData={cacheHitQuery.data}
                indexUsageData={indexUsageQuery.data}
                indexStatsData={indexStatsQuery.data}
                seqScansData={seqScansQuery.data}
                unusedIndexesData={unusedIndexesQuery.data}
                isCacheHitLoading={cacheHitQuery.isFetching}
                isIndexUsageLoading={indexUsageQuery.isFetching}
                isIndexStatsLoading={indexStatsQuery.isFetching}
                isSeqScansLoading={seqScansQuery.isFetching}
                isUnusedIndexesLoading={unusedIndexesQuery.isFetching}
                hasPgStatStatements={hasPgStatStatements}
              />
            </TabsContent>

            <TabsContent value="connections">
              <ConnectionsReplicationSection
                roleStatsData={roleStatsQuery.data}
                replicationSlotsData={replicationSlotsQuery.data}
                dbStatsData={dbStatsQuery.data}
                isRoleStatsLoading={roleStatsQuery.isFetching}
                isReplicationSlotsLoading={replicationSlotsQuery.isFetching}
                isDbStatsLoading={dbStatsQuery.isFetching}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
