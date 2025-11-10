export const STATUS_REFRESH_FREQUENCY_MS: number = 5000

export enum PipelineStatusName {
  FAILED = 'failed',
  STARTING = 'starting',
  STARTED = 'started',
  STOPPED = 'stopped',
  UNKNOWN = 'unknown',
}
