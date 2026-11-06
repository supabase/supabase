import { FALLBACK_LONG_RUNNING_STATE_THRESHOLD_MINUTES } from './project-transition-state'

const RESTORE_TIME_SLOPE = 720 / 21000
const RESTORE_TIME_BASE_MINUTES = 3
const LONG_RUNNING_RESTORE_THRESHOLD_MULTIPLIER = 1.5

export const estimateRestoreTimeFromSizeGb = (sizeGb: number) => {
  return RESTORE_TIME_SLOPE * sizeGb + RESTORE_TIME_BASE_MINUTES
}

export const getRestoreLongRunningThresholdMinutes = (volumeSizeGb?: number | null) => {
  if (typeof volumeSizeGb !== 'number' || !Number.isFinite(volumeSizeGb)) {
    return FALLBACK_LONG_RUNNING_STATE_THRESHOLD_MINUTES
  }

  return Math.max(
    FALLBACK_LONG_RUNNING_STATE_THRESHOLD_MINUTES,
    Math.ceil(
      estimateRestoreTimeFromSizeGb(volumeSizeGb) * LONG_RUNNING_RESTORE_THRESHOLD_MULTIPLIER
    )
  )
}
