export const STATUS_REFRESH_FREQUENCY_MS: number = 10000 // 10 seconds

export enum PipelineStatusName {
  FAILED = 'failed',
  STARTING = 'starting',
  STARTED = 'started',
  STOPPED = 'stopped',
  STOPPING = 'stopping',
  UNKNOWN = 'unknown',
}
