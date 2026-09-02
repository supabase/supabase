import { useParams } from 'common'
import { Activity, ChevronDown, RotateCcw, Search, X } from 'lucide-react'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
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
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { BatchRestartDialog } from '../BatchRestartDialog'
import { ErrorDetailsDialog } from '../ErrorDetailsDialog'
import { getStatusName, PIPELINE_ACTIONABLE_STATES } from '../Pipeline.utils'
import { PipelineStatusName, STATUS_REFRESH_FREQUENCY_MS } from '../Replication.constants'
import { RestartTableDialog } from '../RestartTableDialog'
import { PipelineConfigurationSection } from './PipelineConfigurationSection'
import { PipelineHealthSection } from './PipelineHealthSection'
import {
  getDisabledStateConfig,
  getPipelineStateNotice,
  getTableStatusEmptyState,
} from './ReplicationPipelineStatus.utils'
import { TableReplicationRow } from './TableReplicationRow'
import { AlertError } from '@/components/ui/AlertError'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { useReplicationDestinationByIdQuery } from '@/data/replication/destination-by-id-query'
import { useReplicationPipelineByIdQuery } from '@/data/replication/pipeline-by-id-query'
import {
  useReplicationPipelineReplicationStatusQuery,
  type ReplicationPipelineTableStatus,
} from '@/data/replication/pipeline-replication-status-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'

type TableSortColumn = 'table' | 'status'
type TableSort = `${TableSortColumn}:${'asc' | 'desc'}`

// Worst first, so sorting ascending by status surfaces the tables that need attention.
const TABLE_STATE_SORT_ORDER: ReplicationPipelineTableStatus['state']['name'][] = [
  'error',
  'queued',
  'copying_table',
  'copied_table',
  'following_wal',
]

const compareTableStates = (
  a: ReplicationPipelineTableStatus['state'],
  b: ReplicationPipelineTableStatus['state']
) => TABLE_STATE_SORT_ORDER.indexOf(a.name) - TABLE_STATE_SORT_ORDER.indexOf(b.name)

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
  const [restartingTableIds, setRestartingTableIds] = useState<Set<number>>(new Set())

  const pipelineId = Number(_pipelineId)
  const { getRequestStatus, updatePipelineStatus } = usePipelineRequestStatus()
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

  const { data: destination } = useReplicationDestinationByIdQuery({
    projectRef,
    destinationId: pipeline?.destination_id,
  })

  const { data: pipelineStatusData } = useReplicationPipelineStatusQuery(
    { projectRef, pipelineId },
    {
      enabled: !!pipelineId,
      refetchInterval: STATUS_REFRESH_FREQUENCY_MS,
    }
  )

  const {
    data: replicationStatusData,
    isPending: isStatusLoading,
    isError: isStatusError,
  } = useReplicationPipelineReplicationStatusQuery(
    { projectRef, pipelineId },
    {
      enabled: !!pipelineId,
      refetchInterval: STATUS_REFRESH_FREQUENCY_MS,
    }
  )

  const statusName = getStatusName(pipelineStatusData?.status)
  const config = getDisabledStateConfig({ requestStatus, statusName })

  const tableStatuses = useMemo(
    () => replicationStatusData?.table_statuses ?? [],
    [replicationStatusData?.table_statuses]
  )

  const applyLagMetrics = replicationStatusData?.apply_lag

  const [sort, setSort] = useState<TableSort>('table:asc')
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
  const isAnyRestartInProgress = restartingTableIds.size > 0

  const hasTableData = tableStatuses.length > 0
  const isPipelineActionable = PIPELINE_ACTIONABLE_STATES.includes(statusName as PipelineStatusName)
  const isEnablingDisabling =
    requestStatus === PipelineStatusRequestStatus.StartRequested ||
    requestStatus === PipelineStatusRequestStatus.StopRequested ||
    requestStatus === PipelineStatusRequestStatus.RestartRequested
  const showDisabledState = isEnablingDisabling || isAnyRestartInProgress || !isPipelineActionable
  const lastKnownStateMessage =
    statusName === PipelineStatusName.STOPPED
      ? 'Showing the last known table state before the pipeline was stopped.'
      : statusName === PipelineStatusName.FAILED
        ? 'Showing the last reported table state before the pipeline failed.'
        : null
  const stateNotice = getPipelineStateNotice({ requestStatus, statusName, tableStatuses })
  const logsUrl = `/project/${projectRef}/logs/replication-logs?f=${encodeURIComponent(
    JSON.stringify({ pipeline_id: pipelineId })
  )}`
  const emptyState = getTableStatusEmptyState({
    isDisabled: showDisabledState,
    disabledStateConfig: config,
    statusName,
  })

  useEffect(() => {
    updatePipelineStatus(pipelineId, statusName)
  }, [pipelineId, statusName, updatePipelineStatus])

  return (
    <PageContainer size="large">
      {(isPipelineError || isStatusError) && (
        <PageSection>
          <PageSectionContent className="flex flex-col gap-y-4">
            {isPipelineError && (
              <AlertError error={pipelineError} subject="Failed to retrieve pipeline information" />
            )}
            {isStatusError && (
              <Admonition
                type="warning"
                title="Live updates paused"
                description="We can't reach this pipeline right now. Retrying automatically."
              />
            )}
          </PageSectionContent>
        </PageSection>
      )}

      {(isPipelineLoading || isStatusLoading) && (
        <PageSection>
          <PageSectionContent>
            <GenericSkeletonLoader />
          </PageSectionContent>
        </PageSection>
      )}

      {stateNotice !== undefined && (
        <PageSection>
          <PageSectionContent>
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
          </PageSectionContent>
        </PageSection>
      )}

      {pipeline !== undefined && (
        <PipelineConfigurationSection pipeline={pipeline} destination={destination} />
      )}

      {applyLagMetrics && (
        <PipelineHealthSection metrics={applyLagMetrics} isStale={isStatusError} />
      )}

      {!isPipelineLoading && !isStatusLoading && (
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Replicated tables</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>

          <PageSectionContent className="flex flex-col gap-y-4">
            {!hasTableData ? (
              <EmptyStatePresentational
                icon={Activity}
                title={emptyState.title}
                description={emptyState.description}
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Input
                    icon={<Search />}
                    size="tiny"
                    className="text-xs w-52"
                    placeholder="Search for tables"
                    value={searchString}
                    disabled={isPipelineError}
                    onChange={(e) => setSearchString(e.target.value)}
                    actions={
                      searchString.length > 0 && [
                        <X
                          key="close"
                          className="mx-2 cursor-pointer text-foreground"
                          size={14}
                          strokeWidth={1.5}
                          onClick={() => setSearchString('')}
                        />,
                      ]
                    }
                  />
                  <div className="flex items-center">
                    <Button
                      size="tiny"
                      variant="default"
                      className="rounded-r-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
                      icon={<RotateCcw />}
                      disabled={isAnyRestartInProgress || showDisabledState || isPipelineError}
                      loading={isAnyRestartInProgress}
                      onClick={() => {
                        setBatchRestartMode('all')
                        setShowBatchRestartDialog(true)
                      }}
                    >
                      Restart all tables
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="default"
                          aria-label="More restart options"
                          icon={<ChevronDown />}
                          className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px focus-visible:z-10 focus-visible:rounded-l-sm"
                          disabled={showDisabledState || isPipelineError}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItemTooltip
                          disabled={
                            !hasErroredTables || isAnyRestartInProgress || showDisabledState
                          }
                          onClick={() => {
                            setBatchRestartMode('errored')
                            setShowBatchRestartDialog(true)
                          }}
                          tooltip={{
                            content: {
                              side: 'left',
                              text: !hasErroredTables ? 'No failed tables' : undefined,
                            },
                          }}
                        >
                          Restart failed tables only
                        </DropdownMenuItemTooltip>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

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
                        disabled={isAnyRestartInProgress || isPipelineError}
                        loading={isAnyRestartInProgress}
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

                {lastKnownStateMessage !== null && !showDisabledState && (
                  <Admonition type="note" description={lastKnownStateMessage} />
                )}

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
                        {filteredTableStatuses.length === 0 && (
                          <TableRow className="[&>td]:hover:bg-inherit">
                            <TableCell colSpan={4}>
                              <p className="text-sm text-foreground">No results found</p>
                              <p className="text-sm text-foreground-lighter">
                                Your search for "{searchString}" did not return any results.
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                        {filteredTableStatuses.map((table) => {
                          const isRestarting = restartingTableIds.has(table.id)
                          const isErrorState = table.state.name === 'error'
                          const errorReason =
                            isErrorState && 'reason' in table.state ? table.state.reason : undefined
                          const errorSolution =
                            isErrorState && 'solution' in table.state
                              ? table.state.solution
                              : undefined
                          return (
                            <TableReplicationRow
                              key={table.id}
                              table={table}
                              isRestarting={isRestarting}
                              showDisabledState={showDisabledState}
                              disabledStateMessage={config.message}
                              isAnyRestartInProgress={isAnyRestartInProgress}
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
              </>
            )}
          </PageSectionContent>
        </PageSection>
      )}

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
          onRestartStart={() => {
            setRestartingTableIds((prev) => new Set(prev).add(selectedTableForRestart.id))
          }}
          onRestartComplete={() => {
            setRestartingTableIds((prev) => {
              const next = new Set(prev)
              next.delete(selectedTableForRestart.id)
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
          onRestartStart={(tableIds) => {
            setRestartingTableIds((prev) => new Set([...prev, ...tableIds]))
          }}
          onRestartComplete={(tableIds) => {
            setRestartingTableIds((prev) => {
              const next = new Set(prev)
              tableIds.forEach((id) => next.delete(id))
              return next
            })
          }}
        />
      )}
    </PageContainer>
  )
}
