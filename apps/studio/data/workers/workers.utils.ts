import type { components } from 'api-types'

import type { Worker, WorkerBuildState } from '@/components/interfaces/Workers/Workers.types'

type WorkerDatum = components['schemas']['V2WorkerResponse']['data']

const BUILD_STATES: WorkerBuildState[] = ['building', 'active', 'failed']

const parseBuildState = (value: string): WorkerBuildState =>
  BUILD_STATES.find((state) => state === value) ?? 'failed'

export const parseWorker = ({ id, attributes }: WorkerDatum): Worker => ({
  name: id,
  buildState: parseBuildState(attributes.build_state),
  isDeleting: attributes.deleting ?? false,
  runtime: attributes.spec.runtime,
  size: attributes.spec.size,
  access: attributes.spec.exposure === 'public' ? 'public' : 'private',
  declaredInstances: attributes.spec.instances,
  instances: attributes.instances,
  imageVersion: attributes.image_version,
  stateReason: attributes.state_reason,
  instancesError: attributes.instances_error,
})
