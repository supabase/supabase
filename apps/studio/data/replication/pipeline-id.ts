import { z } from 'zod'

export const pipelineIdSchema = z
  .union([z.string().min(1), z.number().int().positive().safe()])
  .transform(String)
