import type { components } from 'api-types'

type WorkerAttributes = components['schemas']['V2WorkerResponse_Output']['data']['attributes']

export type WorkerBuildState = WorkerAttributes['build_state']

export type WorkerInstanceTally = NonNullable<WorkerAttributes['instances']>

// The API types `spec.exposure` as a free-form string; the UI only handles these two values.
export type WorkerAccess = 'public' | 'private'

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
