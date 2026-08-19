import { z } from 'zod'

import { WORKER_MAX_INSTANCES, WORKER_MIN_INSTANCES } from './Workers.constants'

// Worker names become the URL slug and the CLI argument, so they follow the CLI's slug rules.
const WORKER_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const CreateWorkerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Provide a name for your worker')
    .max(48, 'Use 48 characters or fewer')
    .regex(WORKER_NAME_PATTERN, 'Lowercase letters, numbers, and hyphens only'),
  runtime: z.string().min(1, 'Pick a runtime'),
  size: z.string().min(1, 'Pick a size'),
  access: z.enum(['public', 'private']),
  instances: z.coerce
    .number()
    .int('Whole numbers only')
    .gte(WORKER_MIN_INSTANCES, `At least ${WORKER_MIN_INSTANCES} instance`)
    .lte(WORKER_MAX_INSTANCES, `At most ${WORKER_MAX_INSTANCES} instances`),
})

export type CreateWorkerForm = z.infer<typeof CreateWorkerSchema>
