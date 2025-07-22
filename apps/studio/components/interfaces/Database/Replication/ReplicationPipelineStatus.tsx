import { useParams } from 'common'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { useReplicationPipelineReplicationStatusQuery } from 'data/replication/pipeline-replication-status-query'
import { useReplicationPipelineByIdQuery } from 'data/replication/pipeline-by-id-query'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import PipelineStatus, { PipelineStatusRequestStatus } from './PipelineStatus'
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
  Copy, 
  ExternalLink,
  ChevronLeft,
  Search,
  AlertTriangle,
  Activity,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { copyToClipboard } from 'ui'

type TableState = {
  table_id: number
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
    data: pipelineStatusData,
    error: pipelineStatusError,
    isLoading: isPipelineStatusLoading,
    isError: isPipelineStatusError,
    isSuccess: isPipelineStatusSuccess,
  } = useReplicationPipelineStatusQuery(
    { projectRef, pipelineId },
    { 
      enabled: !!pipelineId,
      refetchInterval: 2000 // Poll every 2 seconds
    }
  )

  const {
    data: replicationStatusData,
    error: statusError,
    isLoading: isStatusLoading,
    isError: isStatusError,
  } = useReplicationPipelineReplicationStatusQuery(
    { projectRef, pipelineId },
    { 
      enabled: !!pipelineId,
      refetchInterval: 2000 // Poll every 2 seconds
    }
  )


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
          badge: <Badge variant="warning">Queued</Badge>,
          description: 'Waiting to start replication',
          color: 'text-warning-600'
        }
      case 'copying_table':
        return {
          badge: <Badge variant="brand">Copying</Badge>,
          description: 'Initial data copy in progress',
          color: 'text-brand-600'
        }
      case 'copied_table':
        return {
          badge: <Badge variant="success">Copied</Badge>,
          description: 'Initial copy completed',
          color: 'text-success-600'
        }
      case 'following_wal':
        return {
          badge: <Badge variant="success">Live</Badge>,
          description: `Replicating live changes (${state.lag}ms lag)`,
          color: 'text-success-600'
        }
      case 'error':
        return {
          badge: <Badge variant="destructive">Error</Badge>,
          description: state.message,
          color: 'text-destructive-600'
        }
      default:
        return {
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
  const hasErrors = errorTables.length > 0
  const isPipelineRunning = pipelineStatusData?.status?.name === 'started'
  const isPipelineNotRunning = !isPipelineRunning // Any state other than 'started' is not running
  
  
  const getPipelineStateWarning = () => {
    if (!pipelineStatusData?.status) return null
    
    const status = pipelineStatusData.status
    switch (status.name) {
      case 'starting':
        return {
          type: 'warning' as const,
          title: 'Pipeline Starting',
          message: 'The replication pipeline is initializing. Table status will be available once started.',
          color: 'warning'
        }
      case 'stopped':
        return {
          type: 'info' as const,
          title: 'Pipeline Stopped',
          message: 'Replication is currently paused. Enable the pipeline to resume data synchronization.',
          color: 'muted'
        }
      case 'unknown':
        return {
          type: 'warning' as const,
          title: 'Pipeline Status Unknown',
          message: 'Unable to determine pipeline status. Check the logs for more information.',
          color: 'warning'
        }
      default:
        if (status.name !== 'started' && status.name !== 'failed') {
          return {
            type: 'warning' as const,
            title: 'Pipeline Not Running',
            message: 'The replication pipeline is not in a running state. Table status may be limited.',
            color: 'warning'
          }
        }
        return null
    }
  }
  
  const pipelineWarning = getPipelineStateWarning()

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
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold">{destinationName || 'Pipeline'}</h3>
              <PipelineStatus
                pipelineStatus={pipelineStatusData?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
                isSuccess={isPipelineStatusSuccess}
                requestStatus={PipelineStatusRequestStatus.None}
              />
            </div>
            <p className="text-sm text-foreground-light">
              Table replication status
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
        </div>
      </div>

      {(isPipelineLoading || isStatusLoading) && <GenericSkeletonLoader />}

      {isStatusError && (
        <AlertError 
          error={statusError} 
          subject="Failed to retrieve table replication status"
        />
      )}


      {/* Pipeline state warning */}
      {pipelineWarning && (
        <div className={`p-4 border rounded-lg ${
          pipelineWarning.color === 'warning' 
            ? 'border-warning-300 bg-warning-100' 
            : 'border-border-muted bg-surface-100'
        }`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${
              pipelineWarning.color === 'warning' 
                ? 'text-warning-600' 
                : 'text-foreground-light'
            }`} />
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium mb-1 ${
                pipelineWarning.color === 'warning' 
                  ? 'text-warning-900' 
                  : 'text-foreground'
              }`}>
                {pipelineWarning.title}
              </h4>
              <p className={`text-sm ${
                pipelineWarning.color === 'warning' 
                  ? 'text-warning-700' 
                  : 'text-foreground-light'
              }`}>
                {pipelineWarning.message}
              </p>
            </div>
          </div>
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

      {/* Pipeline not running state - generic disabled state */}
      {isPipelineNotRunning && tableStatuses.length > 0 && (
        <div className="space-y-4">
          <div className="p-6 border border-border-muted bg-surface-50 rounded-lg">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-surface-200 rounded-full flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6 text-foreground-lighter" />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-medium text-foreground-light">
                  {pipelineStatusData?.status?.name === 'failed' ? 'Pipeline Failed' :
                   pipelineStatusData?.status?.name === 'stopped' ? 'Pipeline Stopped' :
                   pipelineStatusData?.status?.name === 'starting' ? 'Pipeline Starting' :
                   'Pipeline Not Running'}
                </h4>
                <p className="text-sm text-foreground-light max-w-md mx-auto">
                  {pipelineStatusData?.status?.name === 'failed' ? 'Replication has failed. Check the logs for details. Table status is disabled.' :
                   pipelineStatusData?.status?.name === 'stopped' ? 'Replication is paused. Enable the pipeline to resume data synchronization.' :
                   pipelineStatusData?.status?.name === 'starting' ? 'Pipeline is initializing. Table status will be available once started.' :
                   'Pipeline is not actively running. Table status information is disabled.'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="w-full overflow-hidden overflow-x-auto">
            <Table
              head={[
                <Table.th key="table">Table</Table.th>,
                <Table.th key="status">Status</Table.th>,
                <Table.th key="details">Details</Table.th>,
                <Table.th key="actions" className="w-16 text-center">Actions</Table.th>,
              ]}
              body={filteredTableStatuses.map((table: TableState, index: number) => {
                return (
                  <Table.tr key={`${table.table_name}-${index}`} className="border-t opacity-50">
                    <Table.td>
                      <Link 
                        href={`/project/${projectRef}/editor/${table.table_id}`}
                        className="font-mono text-sm font-medium text-foreground-lighter hover:text-foreground transition-colors cursor-pointer underline underline-offset-2"
                      >
                        {table.table_name}
                      </Link>
                    </Table.td>
                    <Table.td>
                      <Badge variant="secondary" className="text-foreground-lighter bg-surface-100 border-border-muted">
                        {pipelineStatusData?.status?.name === 'failed' ? 'Failed' :
                         pipelineStatusData?.status?.name === 'stopped' ? 'Stopped' :
                         pipelineStatusData?.status?.name === 'starting' ? 'Starting' :
                         'Disabled'}
                      </Badge>
                    </Table.td>
                    <Table.td>
                      <div className="text-sm text-foreground-lighter">
                        Status unavailable while pipeline is {pipelineStatusData?.status?.name || 'not running'}
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
                              disabled={true}
                              className="h-auto p-2 opacity-40 cursor-not-allowed"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy unavailable while pipeline is not running</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Table.td>
                  </Table.tr>
                )
              })}
            />
          </div>
        </div>
      )}

      {/* Tables list - active/running pipeline */}
      {isPipelineRunning && !isStatusLoading && tableStatuses.length > 0 && (
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
                    <Link 
                      href={`/project/${projectRef}/editor/${table.table_id}`}
                      className="font-mono text-sm font-medium text-foreground hover:text-foreground-light transition-colors cursor-pointer underline underline-offset-2"
                    >
                      {table.table_name}
                    </Link>
                  </Table.td>
                  <Table.td>
                    {statusConfig.badge}
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


      {/* No results - running pipeline */}
      {isPipelineRunning && !isStatusLoading && filteredTableStatuses.length === 0 && tableStatuses.length > 0 && (
        <div className="text-center py-8 text-foreground-light">
          <p>No tables match "{filterString}"</p>
        </div>
      )}
      
      {/* No results - not running pipeline */}
      {isPipelineNotRunning && !isStatusLoading && filteredTableStatuses.length === 0 && tableStatuses.length > 0 && (
        <div className="text-center py-8 text-foreground-light">
          <p>No tables match "{filterString}"</p>
        </div>
      )}

      {/* Empty state - running pipeline */}
      {isPipelineRunning && !isStatusLoading && tableStatuses.length === 0 && (
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
            <p className="text-xs text-foreground-lighter">
              Data refreshes automatically every 2 seconds
            </p>
          </div>
        </div>
      )}
      
      {/* Empty state - not running pipeline */}
      {isPipelineNotRunning && !isStatusLoading && tableStatuses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-full max-w-sm mx-auto text-center space-y-4">
            <div className="w-16 h-16 bg-surface-200 rounded-full flex items-center justify-center mx-auto">
              <Activity className="w-8 h-8 text-foreground-lighter" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-foreground-light">Pipeline Not Running</h4>
              <p className="text-sm text-foreground-light leading-relaxed">
                The replication pipeline is currently {pipelineStatusData?.status?.name || 'not active'}. 
                Table status information is not available while the pipeline is in this state.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReplicationPipelineStatus