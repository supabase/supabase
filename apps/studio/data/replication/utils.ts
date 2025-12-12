import { MAX_RETRY_FAILURE_COUNT } from 'data/query-client'
import { ResponseError } from 'types'

export const checkReplicationFeatureFlagRetry = (
  failureCount: number,
  error: ResponseError
): boolean => {
  const isFeatureFlagRequiredError =
    error instanceof ResponseError &&
    error.code === 503 &&
    error.message.includes('feature flag is required')

  if (isFeatureFlagRequiredError) {
    return false
  }

  if (failureCount < MAX_RETRY_FAILURE_COUNT) {
    return true
  }

  return false
}
