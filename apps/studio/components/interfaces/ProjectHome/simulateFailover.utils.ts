export type FailoverSimulationPhase = 'off' | 'healthy' | 'promoting' | 'failover'

export const FAILOVER_SIMULATION_HEALTHY_MS = 3_000
export const FAILOVER_SIMULATION_PROMOTING_MS = 2_500
export const FAILOVER_SIMULATION_FAILOVER_AT_MS =
  FAILOVER_SIMULATION_HEALTHY_MS + FAILOVER_SIMULATION_PROMOTING_MS

/**
 * One-shot healthy → promoting → failover timeline for `simulateFailover=true`.
 * Reduced motion skips ahead to the completed failover layout.
 */
export const getFailoverSimulationPhase = ({
  enabled,
  elapsedMs,
  prefersReducedMotion = false,
}: {
  enabled: boolean
  elapsedMs: number
  prefersReducedMotion?: boolean
}): FailoverSimulationPhase => {
  if (!enabled) return 'off'
  if (prefersReducedMotion) return 'failover'
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 'healthy'
  if (elapsedMs < FAILOVER_SIMULATION_HEALTHY_MS) return 'healthy'
  if (elapsedMs < FAILOVER_SIMULATION_FAILOVER_AT_MS) return 'promoting'
  return 'failover'
}

/** Milliseconds until the next phase, or `undefined` once failover has been reached. */
export const getFailoverSimulationDelayMs = (elapsedMs: number): number | undefined => {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return FAILOVER_SIMULATION_HEALTHY_MS
  if (elapsedMs < FAILOVER_SIMULATION_HEALTHY_MS) {
    return FAILOVER_SIMULATION_HEALTHY_MS - elapsedMs
  }
  if (elapsedMs < FAILOVER_SIMULATION_FAILOVER_AT_MS) {
    return FAILOVER_SIMULATION_FAILOVER_AT_MS - elapsedMs
  }
  return undefined
}

export const getFailoverSimulationStatusLabel = (
  phase: FailoverSimulationPhase
): string | undefined => {
  if (phase === 'promoting') return 'Promoting replica'
  if (phase === 'failover') return 'Replica promoted'
  return undefined
}
