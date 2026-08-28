import { z } from 'zod'

import type { Worker, WorkerBuildState } from '@/components/interfaces/Workers/Workers.types'

const BUILD_STATES = ['building', 'active', 'failed'] as const satisfies readonly WorkerBuildState[]

const WorkerResponseSchema = z.object({
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

export const parseWorker = (datum: unknown): Worker => {
  const { id, attributes } = WorkerResponseSchema.parse(datum)
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
