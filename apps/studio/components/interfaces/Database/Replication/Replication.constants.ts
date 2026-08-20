export const STATUS_REFRESH_FREQUENCY_MS: number = 10000 // 10 seconds

export enum PipelineStatusName {
  FAILED = 'failed',
  STARTING = 'starting',
  STARTED = 'started',
  STOPPED = 'stopped',
  STOPPING = 'stopping',
  UNKNOWN = 'unknown',
}

export const PIPELINES_FEEDBACK_URL = 'https://github.com/orgs/supabase/discussions/39416'

/** @deprecated Import from Settings/Infrastructure/ReadReplicas/ReadReplicas.constants */
export { REPLICA_STATUS } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicas.constants'
