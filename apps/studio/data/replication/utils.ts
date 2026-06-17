import { MAX_RETRY_FAILURE_COUNT } from '@/data/query-client'
import { ResponseError } from '@/types'

const isLocal =
  process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod' &&
  process.env.NEXT_PUBLIC_ENVIRONMENT !== 'staging'

export const checkLocalETLNotSetUp = (error: ResponseError | null) => {
  if (error === null) return false

  const isETLAPINotRunning =
    error.code === undefined && error.message.includes('API error happened')
  const isETLNotSetUp =
    error.code === 503 && error.message.includes('replication API URL is not configured')
  return isLocal && (isETLAPINotRunning || isETLNotSetUp)
}

export const checkReplicationFeatureFlagRetry = (
  failureCount: number,
  error: ResponseError
): boolean => {
  const isFeatureFlagRequiredError =
    error instanceof ResponseError &&
    error.code === 503 &&
    error.message.includes('feature flag is required')

  const isLocalETLNotSetUp = checkLocalETLNotSetUp(error)

  if (isFeatureFlagRequiredError || isLocalETLNotSetUp) {
    return false
  }

  if (failureCount < MAX_RETRY_FAILURE_COUNT) {
    return true
  }

  return false
}
