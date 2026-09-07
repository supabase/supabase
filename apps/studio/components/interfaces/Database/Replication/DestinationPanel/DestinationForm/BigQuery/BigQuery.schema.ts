import * as z from 'zod'

import { optionalNumberInputSchema } from '../DestinationForm.schema.utils'

export const BigQueryFormSchema = z.object({
  projectId: z.string().optional(),
  datasetId: z.string().optional(),
  serviceAccountKey: z.string().optional(),
  connectionPoolSize: optionalNumberInputSchema(
    z.number().int().min(1, 'Connection pool size must be greater than 0.')
  ),
  maxStalenessMins: optionalNumberInputSchema(
    z
      .number()
      .int('Maximum staleness must be a whole number of minutes.')
      .min(0, 'Maximum staleness must be 0 or greater.')
  ),
})
