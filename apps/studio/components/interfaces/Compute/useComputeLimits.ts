import { LOCAL_STORAGE_KEYS } from 'common'
import { z } from 'zod'

import {
  COMPUTE_LIMITS_MODES,
  DEFAULT_COMPUTE_LIMITS_MODE,
  getComputeLimits,
  type ComputeLimitsMode,
} from './Compute.limits'
import type { OrgPlan } from '@/data/subscriptions/types'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const computeLimitsModeSchema = z.enum(COMPUTE_LIMITS_MODES)

const canOverrideComputeLimitsMode = () =>
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

export const useComputeLimitsMode = () => {
  const [storedMode, setMode] = useLocalStorageQuery<string>(
    LOCAL_STORAGE_KEYS.COMPUTE_LIMITS_MODE,
    DEFAULT_COMPUTE_LIMITS_MODE
  )
  const parsedMode = computeLimitsModeSchema.safeParse(storedMode)
  const mode: ComputeLimitsMode =
    canOverrideComputeLimitsMode() && parsedMode.success
      ? parsedMode.data
      : DEFAULT_COMPUTE_LIMITS_MODE

  return { mode, setMode }
}

export const useComputeLimits = (plan: { id?: OrgPlan['id']; name?: string } | undefined) => {
  const { mode } = useComputeLimitsMode()
  const isAlpha = mode === 'alpha'
  const planLabel = `${plan?.name ?? 'Current'} Plan`

  return {
    mode,
    limits: getComputeLimits(mode, plan?.id),
    limitsLabel: isAlpha ? 'Private alpha' : planLabel,
    noLimitLabel: isAlpha
      ? 'Not metered during private alpha'
      : `No fixed limit on the ${planLabel}`,
  }
}
