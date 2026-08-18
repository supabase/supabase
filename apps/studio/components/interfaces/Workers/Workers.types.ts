export type WorkerBuildState = 'building' | 'active' | 'failed'

export type WorkerAccess = 'public' | 'private'

export interface WorkerInstanceTally {
  declared: number
  live: number
  ready: number
  stale: number
}

export interface Worker {
  name: string
  buildState: WorkerBuildState
  isDeleting: boolean
  runtime?: string
  size: string
  access: WorkerAccess
  declaredInstances: number
  instances?: WorkerInstanceTally
  imageVersion?: string
  stateReason?: string
  instancesError?: string
}
