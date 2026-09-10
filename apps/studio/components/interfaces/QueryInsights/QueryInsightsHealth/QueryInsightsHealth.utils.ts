import { HEALTH_LEVELS } from './QueryInsightsHealth.constants'
import type { HealthLevel } from './QueryInsightsHealth.types'

export const getHealthLevel = (score: number): HealthLevel => {
  if (score >= HEALTH_LEVELS.healthy.min) return 'healthy'
  if (score >= HEALTH_LEVELS.warning.min) return 'warning'
  return 'critical'
}
