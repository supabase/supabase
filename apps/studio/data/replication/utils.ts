import { MAX_RETRY_FAILURE_COUNT } from '@/data/query-client'
import { ResponseError } from '@/types'

export const ETL_NOT_SET_UP_ERROR = 'replication API URL is not configured'

export const checkReplicationFeatureFlagRetry = (
  failureCount: number,
  error: ResponseError
): boolean => {
  const isFeatureFlagRequiredError =
    error instanceof ResponseError &&
    error.code === 503 &&
    error.message.includes('feature flag is required')

  const isETLAPINotRunning =
    error.code === undefined && error.message.includes('API error happened')
  const isETLNotSetUp = error.code === 503 && error.message.includes(ETL_NOT_SET_UP_ERROR)

  if (isFeatureFlagRequiredError || isETLAPINotRunning || isETLNotSetUp) {
    return false
  }

  if (failureCount < MAX_RETRY_FAILURE_COUNT) {
    return true
  }

  return false
}
