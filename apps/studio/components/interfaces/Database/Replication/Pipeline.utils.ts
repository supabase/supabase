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

export type PipelineDisplayStateKey =
  | 'starting'
  | 'stopping'
  | 'restarting'
  | 'failed'
  | 'stopped'
  | 'running'
  | 'unknown'

export type PipelineDisplayType = 'failure' | 'loading' | 'success' | 'idle'

export interface PipelineDisplayState {
  key: PipelineDisplayStateKey
  label: string
  title: string
  message: string
  badge: string
  type: PipelineDisplayType
}

const PIPELINE_DISPLAY_STATES: Record<PipelineDisplayStateKey, PipelineDisplayState> = {
  starting: {
    key: 'starting',
    label: 'Starting',
    title: 'Starting pipeline',
    message: 'Starting the pipeline. Replication will resume once running.',
    badge: 'Starting',
    type: 'loading',
  },
  stopping: {
    key: 'stopping',
    label: 'Stopping',
    title: 'Stopping pipeline',
    message: 'Stopping replication. Data transfer will be paused once stopped.',
    badge: 'Stopping',
    type: 'loading',
  },
  restarting: {
    key: 'restarting',
    label: 'Restarting',
    title: 'Restarting pipeline',
    message: 'Applying settings and restarting the pipeline.',
    badge: 'Restarting',
    type: 'loading',
  },
  failed: {
    key: 'failed',
    label: 'Failed',
    title: 'Pipeline failed',
    message: 'Replication has encountered an error.',
    badge: 'Failed',
    type: 'failure',
  },
  stopped: {
    key: 'stopped',
    label: 'Stopped',
    title: 'Pipeline stopped',
    message: 'Replication is paused. Start the pipeline to resume data synchronization.',
    badge: 'Stopped',
    type: 'idle',
  },
  running: {
    key: 'running',
    label: 'Running',
    title: 'Pipeline running',
    message: 'Replication is active and processing changes.',
    badge: 'Running',
    type: 'success',
  },
  unknown: {
    key: 'unknown',
    label: 'Unknown',
    title: 'Pipeline status unknown',
    message: 'Unable to determine pipeline status.',
    badge: 'Unknown',
    type: 'idle',
  },
}

export const getPipelineDisplayState = (
  requestStatus?: PipelineStatusRequestStatus,
  statusName?: PipelineStatusName
): PipelineDisplayState => {
  if (requestStatus === PipelineStatusRequestStatus.RestartRequested) {
    return PIPELINE_DISPLAY_STATES.restarting
  }
  if (requestStatus === PipelineStatusRequestStatus.StartRequested) {
    return PIPELINE_DISPLAY_STATES.starting
  }
  if (requestStatus === PipelineStatusRequestStatus.StopRequested) {
    return PIPELINE_DISPLAY_STATES.stopping
  }

  switch (statusName) {
    case PipelineStatusName.STARTING:
      return PIPELINE_DISPLAY_STATES.starting
    case PipelineStatusName.FAILED:
      return PIPELINE_DISPLAY_STATES.failed
    case PipelineStatusName.STOPPED:
      return PIPELINE_DISPLAY_STATES.stopped
    case PipelineStatusName.STARTED:
      return PIPELINE_DISPLAY_STATES.running
    case PipelineStatusName.STOPPING:
      return PIPELINE_DISPLAY_STATES.stopping
    case PipelineStatusName.UNKNOWN:
    default:
      return PIPELINE_DISPLAY_STATES.unknown
  }
}
