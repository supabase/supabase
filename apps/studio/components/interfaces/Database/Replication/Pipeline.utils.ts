import { PipelineStatusName } from './Replication.constants'
import { ReplicationPipelineStatusData } from '@/data/replication/pipeline-status-query'
import { PipelineStatusRequestStatus } from '@/state/replication-pipeline-request-status'

export const PIPELINE_ERROR_MESSAGES = {
  RETRIEVE_PIPELINE: 'Failed to retrieve pipeline information',
  RETRIEVE_PIPELINE_STATUS: 'Failed to retrieve pipeline status',
  RETRIEVE_REPLICATION_STATUS: 'Failed to retrieve table replication status',
  RETRIEVE_DESTINATIONS: 'Failed to retrieve destinations',
  ENABLE_DESTINATION: 'Failed to enable destination',
  DISABLE_DESTINATION: 'Failed to disable destination',
  DELETE_DESTINATION: 'Failed to delete destination',
  NO_PIPELINE_FOUND: 'No pipeline found',
  COPY_TABLE_STATUS: 'Failed to copy table status',
} as const

export const getStatusName = (
  status: ReplicationPipelineStatusData['status'] | undefined
): PipelineStatusName | undefined => {
  if (!status || typeof status !== 'object' || !('name' in status)) return undefined
  return normalizePipelineStatusName(status.name)
}

export const normalizePipelineStatusName = (statusName?: string): PipelineStatusName | undefined =>
  typeof statusName === 'string' &&
  (Object.values(PipelineStatusName) as string[]).includes(statusName)
    ? (statusName as PipelineStatusName)
    : undefined

export const PIPELINE_ENABLE_ALLOWED_FROM: PipelineStatusName[] = [PipelineStatusName.STOPPED]
export const PIPELINE_DISABLE_ALLOWED_FROM: PipelineStatusName[] = [
  PipelineStatusName.STARTED,
  PipelineStatusName.FAILED,
]
export const PIPELINE_ACTIONABLE_STATES: PipelineStatusName[] = [
  PipelineStatusName.FAILED,
  PipelineStatusName.STARTED,
  PipelineStatusName.STOPPED,
]

const PIPELINE_STATE_MESSAGES = {
  enabling: {
    title: 'Starting pipeline',
    message: 'Starting the pipeline. Replication will resume once running.',
    badge: 'Starting',
  },
  disabling: {
    title: 'Stopping pipeline',
    message: 'Stopping the pipeline. Replication will be paused once stopped.',
    badge: 'Stopping',
  },
  restarting: {
    title: 'Restarting pipeline',
    message: 'Applying settings and restarting the pipeline.',
    badge: 'Restarting',
  },
  failed: {
    title: 'Pipeline failed',
    message: 'Replication has encountered an error.',
    badge: 'Failed',
  },
  stopped: {
    title: 'Pipeline stopped',
    message: 'Replication is paused. Start the pipeline to resume data synchronization.',
    badge: 'Stopped',
  },
  starting: {
    title: 'Pipeline starting',
    message: 'Initializing replication. Table status will be available once running.',
    badge: 'Starting',
  },
  stopping: {
    title: 'Pipeline stopping',
    message: 'Stopping replication. Data transfer will be paused once stopped',
    badge: 'Stopping',
  },
  running: {
    title: 'Pipeline running',
    message: 'Replication is active and processing changes',
    badge: 'Running',
  },
  unknown: {
    title: 'Pipeline status unknown',
    message: 'Unable to determine pipeline status.',
    badge: 'Unknown',
  },
  notRunning: {
    title: 'Pipeline not running',
    message: 'Replication is not active. Start the pipeline to begin data synchronization.',
    badge: 'Stopped',
  },
} as const

export const getPipelineStateMessages = (
  requestStatus?: PipelineStatusRequestStatus,
  statusName?: PipelineStatusName
) => {
  // Reflect optimistic request intent immediately after click
  if (requestStatus === PipelineStatusRequestStatus.RestartRequested) {
    return PIPELINE_STATE_MESSAGES.restarting
  }
  if (requestStatus === PipelineStatusRequestStatus.StartRequested) {
    return PIPELINE_STATE_MESSAGES.enabling
  }
  if (requestStatus === PipelineStatusRequestStatus.StopRequested) {
    return PIPELINE_STATE_MESSAGES.disabling
  }

  // Fall back to steady states
  switch (statusName) {
    case PipelineStatusName.STARTING:
      return PIPELINE_STATE_MESSAGES.starting
    case PipelineStatusName.FAILED:
      return PIPELINE_STATE_MESSAGES.failed
    case PipelineStatusName.STOPPED:
      return PIPELINE_STATE_MESSAGES.stopped
    case PipelineStatusName.STARTED:
      return PIPELINE_STATE_MESSAGES.running
    case PipelineStatusName.STOPPING:
      return PIPELINE_STATE_MESSAGES.stopping
    case PipelineStatusName.UNKNOWN:
      return PIPELINE_STATE_MESSAGES.unknown
    default:
      return PIPELINE_STATE_MESSAGES.notRunning
  }
}
