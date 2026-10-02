import { getApplicationId, getITC, getWorkerId } from '@platformatic/globals'

export const manualProfileCaptureMessage = 'profiling:capture'
export type ManualProfileType = 'cpu' | 'heap'

export interface ManualProfileCaptureRequest {
  application: string
  worker: number | string
  type: ManualProfileType
  seconds: number
  reason: string
}

export type ManualProfileCaptureResponse =
  | { scheduled: true }
  | { scheduled: false; reason: 'busy' | 'not-watt' | 'unavailable' }

function hasErrorCode(error: unknown, code: string) {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  )
}

export async function triggerManualProfile(
  type: ManualProfileType,
  seconds: number
): Promise<ManualProfileCaptureResponse> {
  const itc = getITC({ throwOnMissing: false })
  const application = getApplicationId({ throwOnMissing: false })
  const worker = getWorkerId({ throwOnMissing: false })
  if (!itc || application === undefined || worker === undefined) {
    return { scheduled: false, reason: 'not-watt' }
  }

  try {
    const response = (await itc.send(manualProfileCaptureMessage, {
      application,
      worker,
      type,
      seconds,
      reason: 'admin',
    } satisfies ManualProfileCaptureRequest)) as ManualProfileCaptureResponse

    if (
      response?.scheduled === true ||
      (response?.scheduled === false &&
        (response.reason === 'busy' ||
          response.reason === 'not-watt' ||
          response.reason === 'unavailable'))
    ) {
      return response
    }
    return { scheduled: false, reason: 'unavailable' }
  } catch (error) {
    if (hasErrorCode(error, 'PLT_ITC_HANDLER_NOT_FOUND')) {
      return { scheduled: false, reason: 'unavailable' }
    }
    throw error
  }
}
