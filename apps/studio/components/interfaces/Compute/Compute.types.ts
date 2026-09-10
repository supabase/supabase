import type { components } from 'api-types'

type InstanceAttributes = components['schemas']['V2WorkerResponse_Output']['data']['attributes']

export type InstanceBuildState = InstanceAttributes['build_state']

export type InstanceTally = NonNullable<InstanceAttributes['instances']>

// The API types `spec.exposure` as a free-form string; the UI only handles these two values.
export type InstanceAccess = 'public' | 'private'

export interface ComputeInstance {
  name: string
  buildState: InstanceBuildState
  isDeleting: boolean
  runtime?: string
  size: string
  access: InstanceAccess
  declaredInstances: number
  instances?: InstanceTally
  imageVersion?: string
  stateReason?: string
  instancesError?: string
}
