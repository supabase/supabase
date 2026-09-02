import { AWS_REGIONS } from 'shared-data'

import { IS_STAGING_OR_LOCAL } from '@/lib/constants'

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

// Pipelines always run from a single fixed region per environment, regardless of the source
// project's region.
export const PIPELINE_REGION = IS_STAGING_OR_LOCAL
  ? AWS_REGIONS.SOUTHEAST_ASIA
  : AWS_REGIONS.CENTRAL_EU
