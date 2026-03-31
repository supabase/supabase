import z from 'zod'

import { QueryNameSchema } from '../Queues.utils'

const normalQueueSchema = z.object({
  type: z.literal('basic'),
})

const partitionedQueueSchema = z.object({
  type: z.literal('partitioned'),
  partitionInterval: z.coerce.number().int().positive(),
  retentionInterval: z.coerce.number().int().positive(),
})

const unloggedQueueSchema = z.object({
  type: z.literal('unlogged'),
})

export const FormSchema = z.object({
  name: QueryNameSchema,
  enableRls: z.boolean(),
  values: z.discriminatedUnion('type', [
    normalQueueSchema,
    partitionedQueueSchema,
    unloggedQueueSchema,
  ]),
})

export type CreateQueueForm = z.infer<typeof FormSchema>
export type QueueType = CreateQueueForm['values']
