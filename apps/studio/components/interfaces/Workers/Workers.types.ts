export type WorkerRuntime = 'node' | 'deno' | 'bun' | 'python' | 'dockerfile'

export type WorkerSize = '2x1' | '4x2'

export type WorkerAccess = 'public' | 'private'

// A health-check failure is `errored` with errorReason 'unresponsive', not its own state,
// which is how infra reports it.
export type WorkerState =
  | 'deploying'
  | 'active'
  | 'draining'
  | 'suspended'
  | 'resuming'
  | 'errored'
  | 'killed'

export type WorkerErrorReason = 'crash' | 'unresponsive' | 'build' | 'entrypoint' | 'dependency'

export type WorkerLifecycleLevel = 'info' | 'error'

export interface WorkerLifecycleEvent {
  id: string
  at: string
  level: WorkerLifecycleLevel
  message: string
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

export interface WorkerMetrics {
  requests24h: number
  errors24h: number
  errorRate: number
  avgLatencyMs: number
  p99LatencyMs: number
  cpuPercent: number
  memoryPercent: number
}
