/**
 * Types for the Workers prototype (managed compute in microVMs).
 *
 * This is a dashboard prototype — there is no backing Management API yet.
 * All state lives in the valtio mock store (`state/workers-mock-state.ts`).
 */

export type WorkerRuntime = 'node' | 'deno' | 'bun' | 'python' | 'dockerfile'

export type WorkerSize = '2x1' | '4x2'

export type WorkerAccess = 'public' | 'private'

/**
 * Lifecycle states. `unresponsive` is deliberately NOT a separate state — a
 * health-check failure is modelled as `errored` with `errorReason = 'unresponsive'`,
 * which keeps the state machine minimal and matches how infra reports it.
 */
export type WorkerState =
  | 'deploying'
  | 'active'
  | 'draining'
  | 'suspended'
  | 'resuming'
  | 'errored'
  | 'killed'

/** Why a worker ended up in `errored` (surfaced on Overview + in the log feed). */
export type WorkerErrorReason =
  | 'crash'
  | 'unresponsive'
  | 'build'
  | 'entrypoint'
  | 'dependency'

export type WorkerLifecycleLevel = 'info' | 'error'

export interface WorkerLifecycleEvent {
  id: string
  at: string
  level: WorkerLifecycleLevel
  message: string
  /** Present on error events so surfaces can explain the failure. */
  reason?: WorkerErrorReason
}

export interface Worker {
  id: string
  name: string
  runtime: WorkerRuntime
  size: WorkerSize
  access: WorkerAccess
  instances: number
  region: string
  state: WorkerState
  errorReason?: WorkerErrorReason
  createdAt: string
  updatedAt: string
  events: WorkerLifecycleEvent[]
}

/** Rolled-up, last-24h metrics shown on the Overview tab (mocked). */
export interface WorkerMetrics {
  requests24h: number
  errors24h: number
  errorRate: number
  avgLatencyMs: number
  p99LatencyMs: number
  cpuPercent: number
  memoryPercent: number
}
