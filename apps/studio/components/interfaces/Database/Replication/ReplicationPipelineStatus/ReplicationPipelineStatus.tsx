import { useParams } from 'common'
import { Activity, ChevronDown, RotateCcw, Search, X } from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { Input } from 'ui-patterns/DataInputs/Input'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericTableLoader, ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { BatchRestartDialog } from '../BatchRestartDialog'
import { ErrorDetailsDialog } from '../ErrorDetailsDialog'
import { getStatusName } from '../Pipeline.utils'
import { PipelineStatusName } from '../Replication.constants'
import { RestartTableDialog } from '../RestartTableDialog'
import { PipelineHealthSection } from './PipelineHealthSection'
import { getPipelineStateNotice, getTableStatusEmptyState } from './PipelineOverview.utils'
import { getDisabledStateConfig } from './ReplicationPipelineStatus.utils'
import { TableReplicationRow } from './TableReplicationRow'
import { AlertError } from '@/components/ui/AlertError'
import { TableRowNoResults } from '@/components/ui/TableRowNoResults'
import { useReplicationPipelineByIdQuery } from '@/data/replication/pipeline-by-id-query'
import {
  useReplicationPipelineReplicationStatusQuery,
  type ReplicationPipelineTableStatus,
} from '@/data/replication/pipeline-replication-status-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { onSearchInputEscape } from '@/lib/keyboard'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'

type TableSortColumn = 'table' | 'status'
type TableSort = `${TableSortColumn}:${'asc' | 'desc'}`

const TABLE_STATE_SORT_ORDER: ReplicationPipelineTableStatus['state']['name'][] = [
  'error',
  'copying_table',
  'copied_table',
  'following_wal',
  'queued',
]

const compareTableStates = (
  a: ReplicationPipelineTableStatus['state'],
  b: ReplicationPipelineTableStatus['state']
) => TABLE_STATE_SORT_ORDER.indexOf(a.name) - TABLE_STATE_SORT_ORDER.indexOf(b.name)

const PipelineOverviewSkeleton = () => (
  <>
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Pipeline health</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent className="pb-5">
            <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2" aria-hidden>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <ShimmeringLoader className="h-3 w-24 py-0" delayIndex={index} />
                  <ShimmeringLoader className="h-4 w-32 py-0" delayIndex={index} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>

    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Replicated tables</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <GenericTableLoader headers={['Table', 'Status', 'Details', null]} />
      </PageSectionContent>
    </PageSection>
  </>
)

/**
 * Component for displaying replication pipeline status and table replication details.
 * Supports both legacy 'error' state and new 'errored' state with retry policies.
 */
export const ReplicationPipelineStatus = () => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const [searchString, setSearchString] = useQueryState('search', parseAsString.withDefault(''))

  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [selectedTableError, setSelectedTableError] = useState<{
    tableName: string
    reason: string
    solution?: string
  } | null>(null)
  const [showRestartDialog, setShowRestartDialog] = useState(false)
  const [selectedTableForRestart, setSelectedTableForRestart] = useState<{
    id: number
    schema: string
    name: string
  } | null>(null)
  const [showBatchRestartDialog, setShowBatchRestartDialog] = useState(false)
  const [batchRestartMode, setBatchRestartMode] = useState<'all' | 'errored' | null>(null)
  const [resettingTableIds, setResettingTableIds] = useState<Set<number>>(new Set())
  const pipelineId = Number(_pipelineId)
  const { getRequestStatus, isRequestPending } = usePipelineRequestStatus()
  const requestStatus = getRequestStatus(pipelineId)

  const {
    data: pipeline,
    error: pipelineError,
    isPending: isPipelineLoading,
    isError: isPipelineError,
  } = useReplicationPipelineByIdQuery({
    projectRef,
    pipelineId,
  })

  const { data: pipelineStatusData, isPending: isPipelineStatusLoading } =
    useReplicationPipelineStatusQuery({ projectRef, pipelineId }, { enabled: !!pipelineId })

  const {
    data: replicationStatusData,
    isPending: isStatusLoading,
    isError: isStatusError,
  } = useReplicationPipelineReplicationStatusQuery(
    { projectRef, pipelineId },
    { enabled: !!pipelineId }
  )

  const statusName = getStatusName(pipelineStatusData?.status)
  const config = getDisabledStateConfig({ requestStatus, statusName })

  const tableStatuses = useMemo(
    () => replicationStatusData?.table_statuses ?? [],
    [replicationStatusData?.table_statuses]
  )

  const applyLagMetrics = replicationStatusData?.apply_lag

  const [sort, setSort] = useState<TableSort>('status:asc')
  const [sortColumn, sortDirection] = sort.split(':') as [TableSortColumn, 'asc' | 'desc']

  const getAriaSort = (column: TableSortColumn) => {
    if (sortColumn !== column) return 'none'
    return sortDirection === 'asc' ? 'ascending' : 'descending'
  }

  const handleSortChange = (column: TableSortColumn) => {
    if (sortColumn !== column) return setSort(`${column}:asc`)
    setSort(`${column}:${sortDirection === 'asc' ? 'desc' : 'asc'}`)
  }

  const filteredTableStatuses = useMemo(() => {
    const items =
      searchString.length === 0
        ? [...tableStatuses]
        : tableStatuses.filter((table) =>
            `${table.schema}.${table.name}`.toLowerCase().includes(searchString.toLowerCase())
          )

    items.sort((a, b) => {
      const byName = a.schema.localeCompare(b.schema) || a.name.localeCompare(b.name)
      const comparison =
        sortColumn === 'table' ? byName : compareTableStates(a.state, b.state) || byName

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return items
  }, [tableStatuses, searchString, sortColumn, sortDirection])

  const erroredTables = useMemo(
    () => tableStatuses.filter((table) => table.state.name === 'error'),
    [tableStatuses]
  )

  const hasErroredTables = erroredTables.length > 0
  const isLoading = isPipelineLoading || isPipelineStatusLoading || isStatusLoading

  const hasTableData = tableStatuses.length > 0
  const isPipelineActionable =
    statusName === PipelineStatusName.STARTED ||
    statusName === PipelineStatusName.STOPPED ||
    statusName === PipelineStatusName.FAILED
  const hasOptimisticStatus = requestStatus !== PipelineStatusRequestStatus.None
  const isPipelineBusy = hasOptimisticStatus || isRequestPending(pipelineId)
  const isAnyTableResetting = resettingTableIds.size > 0
  const showDisabledState = isPipelineBusy || !isPipelineActionable
  const canResetErroredTables = hasErroredTables && !showDisabledState
  const stateNotice = getPipelineStateNotice({ requestStatus, statusName, tableStatuses })
  const isSlotDisconnected =
    !isStatusError && statusName === PipelineStatusName.STARTED && applyLagMetrics?.active === false
  const logsUrl = `/project/${projectRef}/logs/replication-logs?f=${encodeURIComponent(
    JSON.stringify({ pipeline_id: pipelineId })
  )}`
  const emptyState = getTableStatusEmptyState({
    isDisabled: showDisabledState,
    disabledStateConfig: config,
    statusName,
  })

  return (
    <>
      <PageContainer size="large">
        <p className="sr-only" role="status" aria-live="polite">
          {isLoading ? 'Loading pipeline details' : ''}
        </p>

        {isPipelineError && (
          <PageSection>
            <PageSectionContent>
              <AlertError error={pipelineError} subject="Failed to retrieve pipeline information" />
            </PageSectionContent>
          </PageSection>
        )}

        {isLoading && <PipelineOverviewSkeleton />}

        {!isLoading && (
          <PipelineHealthSection metrics={applyLagMetrics ?? undefined}>
            {stateNotice !== undefined && (
              <Admonition
                type={stateNotice.type}
                layout="responsive"
                title={stateNotice.title}
                description={stateNotice.description}
                actions={
                  stateNotice.showLogsLink ? (
                    <Button asChild variant="default">
                      <Link href={logsUrl}>View logs</Link>
                    </Button>
                  ) : undefined
                }
              />
            )}

            {hasErroredTables && !showDisabledState && (
              <Admonition
                type="destructive"
                layout="responsive"
                title={
                  erroredTables.length === 1
                    ? '1 table stopped replicating'
                    : `${erroredTables.length} tables stopped replicating`
                }
                description="The rest of the pipeline keeps running. Open a table’s error to see what went wrong, then reset it to resume."
                actions={
                  <Button
                    variant="default"
                    icon={<RotateCcw />}
                    disabled={isPipelineBusy || isPipelineError}
                    loading={isPipelineBusy}
                    onClick={() => {
                      setBatchRestartMode('errored')
                      setShowBatchRestartDialog(true)
                    }}
                  >
                    Reset failed tables
                  </Button>
                }
              />
            )}

            {isSlotDisconnected && (
              <Admonition
                type="warning"
                title="Pipeline disconnected"
                description="The pipeline is running but isn’t connected to your database right now. It reconnects on its own; if this persists, check the logs."
              />
            )}

            {isStatusError && (
              <Admonition
                type="warning"
                title="Live updates paused"
                description="We can’t reach this pipeline right now. Health below is the last we received, and we’re retrying automatically."
              />
            )}
          </PipelineHealthSection>
        )}

        {!isLoading && !(isStatusError && !hasTableData) && (
          <PageSection>
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Replicated tables</PageSectionTitle>
              </PageSectionSummary>
            </PageSectionMeta>
            <PageSectionContent className="flex flex-col gap-y-4">
              {hasTableData && (
                <div className="flex flex-col gap-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      icon={<Search />}
                      size="tiny"
                      className="text-xs w-52"
                      placeholder="Search tables"
                      value={searchString}
                      disabled={isPipelineError}
                      onChange={(e) => setSearchString(e.target.value)}
                      onKeyDown={onSearchInputEscape(searchString, setSearchString)}
                      actions={
                        searchString.length > 0 && (
                          <Button
                            aria-label="Clear search"
                            variant="text"
                            icon={<X />}
                            className="p-0 h-5 w-5"
                            onClick={() => setSearchString('')}
                          />
                        )
                      }
                    />
                    <div className="flex items-center">
                      <Button
                        size="tiny"
                        variant="default"
                        className="rounded-r-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
                        icon={<RotateCcw />}
                        disabled={isPipelineBusy || showDisabledState || isPipelineError}
                        loading={isPipelineBusy}
                        onClick={() => {
                          setBatchRestartMode('all')
                          setShowBatchRestartDialog(true)
                        }}
                      >
                        Reset all tables
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="default"
                            aria-label="More reset options"
                            icon={<ChevronDown />}
                            className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px focus-visible:z-10 focus-visible:rounded-l-sm"
                            disabled={showDisabledState || isPipelineError}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem
                            className="data-disabled:pointer-events-auto data-disabled:cursor-not-allowed"
                            disabled={!canResetErroredTables}
                            onClick={() => {
                              if (!canResetErroredTables) return
                              setBatchRestartMode('errored')
                              setShowBatchRestartDialog(true)
                            }}
                          >
                            <div className="flex flex-col gap-y-0.5">
                              <p>Reset failed tables only</p>
                              {!hasErroredTables && (
                                <p className="text-foreground-lighter">No failed tables</p>
                              )}
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead key="table" aria-sort={getAriaSort('table')}>
                              <TableHeadSort
                                column="table"
                                currentSort={sort}
                                onSortChange={handleSortChange}
                              >
                                Table
                              </TableHeadSort>
                            </TableHead>
                            <TableHead key="status" aria-sort={getAriaSort('status')}>
                              <TableHeadSort
                                column="status"
                                currentSort={sort}
                                onSortChange={handleSortChange}
                              >
                                Status
                              </TableHeadSort>
                            </TableHead>
                            <TableHead key="details">Details</TableHead>
                            <TableHead key="actions" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="sr-only" aria-live="polite" role="status">
                            <td colSpan={4}>
                              {filteredTableStatuses.length === 0 && searchString.length > 0
                                ? `No results found for “${searchString}”`
                                : ''}
                            </td>
                          </TableRow>
                          {filteredTableStatuses.length === 0 && (
                            <TableRowNoResults
                              className="[&>td]:hover:bg-inherit"
                              colSpan={4}
                              search={searchString}
                            />
                          )}
                          {filteredTableStatuses.map((table) => {
                            const isResetting = resettingTableIds.has(table.id)
                            const isErrorState = table.state.name === 'error'
                            const errorReason =
                              isErrorState && 'reason' in table.state
                                ? table.state.reason
                                : undefined
                            const errorSolution =
                              isErrorState && 'solution' in table.state
                                ? (table.state.solution ?? undefined)
                                : undefined
                            return (
                              <TableReplicationRow
                                key={table.id}
                                table={table}
                                isRestarting={isResetting}
                                showDisabledState={showDisabledState}
                                disabledStateMessage={config.message}
                                isAnyRestartInProgress={isPipelineBusy || isAnyTableResetting}
                                isPipelineStopped={statusName === PipelineStatusName.STOPPED}
                                onSelectRestart={() => {
                                  setSelectedTableForRestart({
                                    id: table.id,
                                    schema: table.schema,
                                    name: table.name,
                                  })
                                  setShowRestartDialog(true)
                                }}
                                onSelectShowError={
                                  isErrorState && errorReason
                                    ? () => {
                                        setSelectedTableError({
                                          tableName: `${table.schema}.${table.name}`,
                                          reason: errorReason,
                                          solution: errorSolution,
                                        })
                                        setShowErrorDialog(true)
                                      }
                                    : () => {}
                                }
                              />
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!hasTableData && (
                <EmptyStatePresentational
                  icon={Activity}
                  title={emptyState.title}
                  description={emptyState.description}
                />
              )}
            </PageSectionContent>
          </PageSection>
        )}
      </PageContainer>

      {/* Restart Table Confirmation Dialog */}
      {selectedTableForRestart && (
        <RestartTableDialog
          open={showRestartDialog}
          onOpenChange={setShowRestartDialog}
          table={selectedTableForRestart}
          tableSyncCopy={pipeline?.config.table_sync_copy}
          sourceId={pipeline?.source_id}
          publicationName={pipeline?.config.publication_name}
          pipelineStatusName={statusName}
          onResetStart={(tableId) => {
            setResettingTableIds((current) => new Set(current).add(tableId))
          }}
          onResetComplete={(tableId) => {
            setResettingTableIds((current) => {
              const next = new Set(current)
              next.delete(tableId)
              return next
            })
          }}
        />
      )}

      {/* Error Details Dialog */}
      {selectedTableError && (
        <ErrorDetailsDialog
          open={showErrorDialog}
          onOpenChange={setShowErrorDialog}
          tableName={selectedTableError.tableName}
          reason={selectedTableError.reason}
          solution={selectedTableError.solution}
        />
      )}

      {/* Batch Restart Dialog */}
      {batchRestartMode && (
        <BatchRestartDialog
          open={showBatchRestartDialog}
          onOpenChange={setShowBatchRestartDialog}
          mode={batchRestartMode}
          tables={tableStatuses}
          sourceId={pipeline?.source_id}
          publicationName={pipeline?.config.publication_name}
          tableSyncCopy={pipeline?.config.table_sync_copy}
          pipelineStatusName={statusName}
          onResetStart={(tableIds) => {
            setResettingTableIds((current) => new Set([...current, ...tableIds]))
          }}
          onResetComplete={(tableIds) => {
            setResettingTableIds((current) => {
              const next = new Set(current)
              tableIds.forEach((tableId) => next.delete(tableId))
              return next
            })
          }}
        />
      )}
    </>
  )
}
