import { ResponseError } from 'types'

export const checkFeatureFlagRequiredError = (error: ResponseError) => {
  return (
    typeof error === 'object' &&
    error !== null &&
    error.code === 503 &&
    error.message.includes('feature flag is required')
  )
}
