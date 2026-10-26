import { z } from 'zod'

import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'

/** Ordered from least to most data shared with the model. */
export const OPT_IN_LEVELS = [
  'disabled',
  'schema',
  'schema_and_log',
  'schema_and_log_and_data',
] as const

export const optInLevelSchema = z.enum(OPT_IN_LEVELS)

export function isOptInLevelAtLeast(level: AiOptInLevel, minimum: AiOptInLevel): boolean {
  return OPT_IN_LEVELS.indexOf(level) >= OPT_IN_LEVELS.indexOf(minimum)
}

export function lowerOptInLevel(a: AiOptInLevel, b: AiOptInLevel): AiOptInLevel {
  return isOptInLevelAtLeast(a, b) ? b : a
}
