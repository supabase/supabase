import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { useReplicationPipelineReplicationStatusQuery } from 'data/replication/pipeline-replication-status-query'
import { useReplicationPipelineByIdQuery } from 'data/replication/pipeline-by-id-query'
import { useState } from 'react'
import { 
  Button,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Input,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  AlertTriangle, 
  Loader2, 
  Activity,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { copyToClipboard } from 'ui'

type TableState = {
  table_name: string
  state: 
    | { name: 'queued' }
    | { name: 'copying_table' }
    | { name: 'copied_table' }
    | { name: 'following_wal'; lag: number }
    | { name: 'error'; message: string }
}

interface ReplicationPipelineStatusProps {
  pipelineId: number
  destinationName?: string
  onSelectBack: () => void
}

const ReplicationPipelineStatus = ({ 
  pipelineId, 
  destinationName,
  onSelectBack 
}: ReplicationPipelineStatusProps) => {
  const { ref: projectRef } = useParams()
  const [filterString, setFilterString] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    data: pipelineData,
    error: pipelineError,
    isLoading: isPipelineLoading,
    isError: isPipelineError,
  } = useReplicationPipelineByIdQuery({
    projectRef,
    pipelineId,
  })

  const {
    data: replicationStatusData,
    error: statusError,
    isLoading: isStatusLoading,
    isError: isStatusError,
    refetch: refetchStatus,
  } = useReplicationPipelineReplicationStatusQuery(
    { projectRef, pipelineId },
    { 
      enabled: !!pipelineId,
      refetchInterval: 5000 // Poll every 5 seconds
    }
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetchStatus()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleCopyTableStatus = async (tableName: string, state: TableState['state']) => {
    const statusText = `Table: ${tableName}\nStatus: ${state.name}${
      'message' in state ? `\nError: ${state.message}` : ''
    }${
      'lag' in state ? `\nLag: ${state.lag}ms` : ''
    }`
    
    try {
      await copyToClipboard(statusText)
      toast.success('Table status copied to clipboard')
    } catch {
      toast.error('Failed to copy table status')
    }
  }

  const getStatusConfig = (state: TableState['state']) => {
    switch (state.name) {
      case 'queued':
        return {
          icon: <Clock className="w-4 h-4 text-warning-600" />,
          badge: <Badge variant="warning">Queued</Badge>,
          description: 'Waiting to start replication',
          color: 'text-warning-600'
        }
      case 'copying_table':
        return {
          icon: <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />,
          badge: <Badge variant="brand">Copying</Badge>,
          description: 'Initial data copy in progress',
          color: 'text-brand-600'
        }
      case 'copied_table':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-success-600" />,
          badge: <Badge variant="success">Copied</Badge>,
          description: 'Initial copy completed',
          color: 'text-success-600'
        }
      case 'following_wal':
        return {
          icon: <Activity className="w-4 h-4 text-success-600" />,
          badge: <Badge variant="success">Live</Badge>,
          description: `Replicating live changes (${state.lag}ms lag)`,
          color: 'text-success-600'
        }
      case 'error':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-destructive-600" />,
          badge: <Badge variant="destructive">Error</Badge>,
          description: state.message,
          color: 'text-destructive-600'
        }
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4 text-warning-600" />,
          badge: <Badge variant="warning">Unknown</Badge>,
          description: 'Unknown status',
          color: 'text-warning-600'
        }
    }
  }

  const handleNavigateToLogs = () => {
    if (projectRef) {
      const logsUrl = `/project/${projectRef}/logs/postgres-logs`
      window.open(logsUrl, '_blank')
    }
  }

  const tableStatuses = replicationStatusData?.table_statuses || []
  const filteredTableStatuses = filterString.length === 0
    ? tableStatuses
    : tableStatuses.filter((table: TableState) => 
        table.table_name.toLowerCase().includes(filterString.toLowerCase())
      )

  const errorTables = tableStatuses.filter((table: TableState) => table.state.name === 'error')
  const queuedTables = tableStatuses.filter((table: TableState) => table.state.name === 'queued')
  const copyingTables = tableStatuses.filter((table: TableState) => table.state.name === 'copying_table')
  const liveTables = tableStatuses.filter((table: TableState) => table.state.name === 'following_wal')
  const completedTables = tableStatuses.filter((table: TableState) => table.state.name === 'copied_table')
  
  const hasErrors = errorTables.length > 0

  if (isPipelineError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              type="outline"
              onClick={onSelectBack}
              icon={<ChevronLeft />}
              style={{ padding: '5px' }}
            />
            <h3 className="text-xl font-semibold">Pipeline Status</h3>
          </div>
        </div>
        <AlertError 
          error={pipelineError} 
          subject="Failed to retrieve pipeline details"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with back button and filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            type="outline"
            onClick={onSelectBack}
            icon={<ChevronLeft />}
            style={{ padding: '5px' }}
          />
          <div>
            <h3 className="text-xl font-semibold">{destinationName || 'Pipeline Status'}</h3>
            <p className="text-sm text-foreground-light">
              Table replication status • Pipeline {pipelineId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            size="small"
            placeholder="Filter tables"
            value={filterString}
            onChange={(e) => setFilterString(e.target.value)}
            icon={<Search size="14" />}
          />
          <Button
            type="default"
            icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={handleRefresh}
            loading={isRefreshing}
          >
            Refresh
          </Button>
        </div>
      </div>

      {(isPipelineLoading || isStatusLoading) && <GenericSkeletonLoader />}

      {isStatusError && (
        <AlertError 
          error={statusError} 
          subject="Failed to retrieve table replication status"
        />
      )}

      {/* Summary cards */}
      {!isStatusLoading && tableStatuses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {liveTables.length > 0 && (
            <div className="p-4 border border-success-300 bg-success-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-success-600" />
                <div>
                  <div className="text-lg font-semibold text-success-900">{liveTables.length}</div>
                  <div className="text-sm text-success-700">Live replication</div>
                </div>
              </div>
            </div>
          )}
          {copyingTables.length > 0 && (
            <div className="p-4 border border-brand-300 bg-brand-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                <div>
                  <div className="text-lg font-semibold text-brand-900">{copyingTables.length}</div>
                  <div className="text-sm text-brand-700">Copying data</div>
                </div>
              </div>
            </div>
          )}
          {queuedTables.length > 0 && (
            <div className="p-4 border border-warning-300 bg-warning-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-warning-600" />
                <div>
                  <div className="text-lg font-semibold text-warning-900">{queuedTables.length}</div>
                  <div className="text-sm text-warning-700">Queued</div>
                </div>
              </div>
            </div>
          )}
          {errorTables.length > 0 && (
            <div className="p-4 border border-destructive-300 bg-destructive-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive-600" />
                <div>
                  <div className="text-lg font-semibold text-destructive-900">{errorTables.length}</div>
                  <div className="text-sm text-destructive-700">Failed</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error alert */}
      {hasErrors && (
        <div className="p-4 border border-destructive-300 bg-destructive-100 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-destructive-900 mb-1">
                {errorTables.length} table{errorTables.length > 1 ? 's' : ''} failed
              </h4>
              <p className="text-sm text-destructive-700 mb-3">
                Some tables encountered replication errors. Check the logs for detailed error information.
              </p>
              <Button
                type="outline"
                size="tiny"
                icon={<ExternalLink className="w-3 h-3" />}
                onClick={handleNavigateToLogs}
                className="text-destructive-600 border-destructive-300 hover:bg-destructive-50"
              >
                View Logs
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tables list */}
      {!isStatusLoading && tableStatuses.length > 0 && (
        <div className="w-full overflow-hidden overflow-x-auto">
          <Table
            head={[
              <Table.th key="table">Table</Table.th>,
              <Table.th key="status">Status</Table.th>,
              <Table.th key="details">Details</Table.th>,
              <Table.th key="actions" className="w-16 text-center">Actions</Table.th>,
            ]}
            body={filteredTableStatuses.map((table: TableState, index: number) => {
              const statusConfig = getStatusConfig(table.state)
              return (
                <Table.tr key={`${table.table_name}-${index}`} className="border-t hover:bg-surface-100">
                  <Table.td>
                    <div className="font-mono text-sm font-medium text-foreground">
                      {table.table_name}
                    </div>
                  </Table.td>
                  <Table.td>
                    <div className="flex items-center gap-2">
                      {statusConfig.icon}
                      {statusConfig.badge}
                    </div>
                  </Table.td>
                  <Table.td>
                    <div className="space-y-1">
                      <div className="text-sm text-foreground">
                        {statusConfig.description}
                      </div>
                      {'lag' in table.state && (
                        <div className="text-xs text-foreground-light">
                          Lag: {table.state.lag}ms
                        </div>
                      )}
                    </div>
                  </Table.td>
                  <Table.td className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="text"
                            size="tiny"
                            icon={<Copy className="w-3 h-3" />}
                            onClick={() => handleCopyTableStatus(table.table_name, table.state)}
                            className="h-auto p-2 hover:bg-surface-200"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy status details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Table.td>
                </Table.tr>
              )
            })}
          />
        </div>
      )}

      {/* No results */}
      {!isStatusLoading && filteredTableStatuses.length === 0 && tableStatuses.length > 0 && (
        <div className="text-center py-8 text-foreground-light">
          <p>No tables match "{filterString}"</p>
        </div>
      )}

      {/* Empty state */}
      {!isStatusLoading && tableStatuses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-full max-w-sm mx-auto text-center space-y-4">
            <div className="w-16 h-16 bg-surface-200 rounded-full flex items-center justify-center mx-auto">
              <Activity className="w-8 h-8 text-foreground-lighter" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-foreground">No table status information</h4>
              <p className="text-sm text-foreground-light leading-relaxed">
                This pipeline doesn't have any table replication status data available yet. 
                The status will appear here once replication begins.
              </p>
            </div>
            <Button type="default" onClick={handleRefresh} loading={isRefreshing}>
              Refresh Status
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReplicationPipelineStatus