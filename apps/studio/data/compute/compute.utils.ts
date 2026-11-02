import { z } from 'zod'

import type {
  ComputeInstance,
  ComputeInstanceBuildState,
} from '@/components/interfaces/Compute/Compute.types'

const BUILD_STATES = [
  'building',
  'active',
  'failed',
] as const satisfies readonly ComputeInstanceBuildState[]

const ComputeInstanceResponseSchema = z.object({
  id: z.string(),
  attributes: z.object({
    build_state: z.enum(BUILD_STATES).catch('failed'),
    deleting: z.boolean().optional(),
    image_version: z.string().optional(),
    instances: z
      .object({
        declared: z.number(),
        live: z.number(),
        ready: z.number(),
        stale: z.number(),
      })
      .optional(),
    instances_error: z.string().optional(),
    spec: z.object({
      exposure: z.string(),
      instances: z.number(),
      runtime: z.string().optional(),
      size: z.string(),
    }),
    state_reason: z.string().optional(),
  }),
})

// Deploys/deletes happen via the CLI, not a dashboard mutation, so polling never fully stops —
// it just slows down once nothing is building or deleting.
export const COMPUTE_POLL_BASELINE_INTERVAL = 10000
export const COMPUTE_POLL_TRANSIENT_INTERVAL = 3000

const isTransient = (instance: ComputeInstance) =>
  instance.buildState === 'building' || instance.isDeleting

export const computeRefetchInterval = (instances: ComputeInstance[] | undefined) =>
  instances?.some(isTransient) ? COMPUTE_POLL_TRANSIENT_INTERVAL : COMPUTE_POLL_BASELINE_INTERVAL

export const computeInstanceRefetchInterval = (instance: ComputeInstance | undefined) =>
  instance !== undefined && isTransient(instance)
    ? COMPUTE_POLL_TRANSIENT_INTERVAL
    : COMPUTE_POLL_BASELINE_INTERVAL

export const parseComputeInstance = (datum: unknown): ComputeInstance => {
  const { id, attributes } = ComputeInstanceResponseSchema.parse(datum)
  return {
    name: id,
    buildState: attributes.build_state,
    isDeleting: attributes.deleting ?? false,
    runtime: attributes.spec.runtime,
    size: attributes.spec.size,
    access: attributes.spec.exposure === 'public' ? 'public' : 'private',
    declaredInstances: attributes.spec.instances,
    instances: attributes.instances,
    imageVersion: attributes.image_version,
    stateReason: attributes.state_reason,
    instancesError: attributes.instances_error,
  }
}
