export type FailoverSimulationPhase = 'off' | 'healthy' | 'failing' | 'promoting' | 'failover'

export const FAILOVER_SIMULATION_HEALTHY_MS = 5_000
/** Beat between the primary failing and promotion starting, so the two read as cause and effect. */
export const FAILOVER_SIMULATION_FAILING_MS = 600
export const FAILOVER_SIMULATION_PROMOTING_MS = 2_500
export const FAILOVER_SIMULATION_PROMOTING_AT_MS =
  FAILOVER_SIMULATION_HEALTHY_MS + FAILOVER_SIMULATION_FAILING_MS
export const FAILOVER_SIMULATION_FAILOVER_AT_MS =
  FAILOVER_SIMULATION_PROMOTING_AT_MS + FAILOVER_SIMULATION_PROMOTING_MS

const PHASE_BOUNDARIES_MS = [
  FAILOVER_SIMULATION_HEALTHY_MS,
  FAILOVER_SIMULATION_PROMOTING_AT_MS,
  FAILOVER_SIMULATION_FAILOVER_AT_MS,
]

/**
 * One-shot healthy → failing → promoting → failover timeline for `simulateFailover=true`.
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
  if (elapsedMs < FAILOVER_SIMULATION_PROMOTING_AT_MS) return 'failing'
  if (elapsedMs < FAILOVER_SIMULATION_FAILOVER_AT_MS) return 'promoting'
  return 'failover'
}

/** Milliseconds until the next phase, or `undefined` once failover has been reached. */
export const getFailoverSimulationDelayMs = (elapsedMs: number): number | undefined => {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return FAILOVER_SIMULATION_HEALTHY_MS
  const nextBoundaryMs = PHASE_BOUNDARIES_MS.find((boundaryMs) => elapsedMs < boundaryMs)
  return nextBoundaryMs === undefined ? undefined : nextBoundaryMs - elapsedMs
}

export const getFailoverSimulationStatusLabel = (
  phase: FailoverSimulationPhase
): string | undefined => {
  if (phase === 'failing') return 'Primary unhealthy'
  if (phase === 'promoting') return 'Promoting replica'
  if (phase === 'failover') return 'Replica promoted'
  return undefined
}
