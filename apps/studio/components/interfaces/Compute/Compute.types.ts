import type { components } from 'api-types'

type ComputeInstanceAttributes =
  components['schemas']['V2WorkerResponse_Output']['data']['attributes']

export type ComputeInstanceBuildState = ComputeInstanceAttributes['build_state']

export type ComputeInstanceTally = NonNullable<ComputeInstanceAttributes['instances']>

// The API types `spec.exposure` as a free-form string; the UI only handles these two values.
export type ComputeInstanceAccess = 'public' | 'private'

export interface ComputeInstance {
  name: string
  buildState: ComputeInstanceBuildState
  isDeleting: boolean
  runtime?: string
  size: string
  access: ComputeInstanceAccess
  declaredInstances: number
  instances?: ComputeInstanceTally
  imageVersion?: string
  stateReason?: string
  instancesError?: string
}
