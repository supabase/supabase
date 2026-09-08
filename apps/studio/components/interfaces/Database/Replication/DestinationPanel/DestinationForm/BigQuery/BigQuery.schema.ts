import * as z from 'zod'

import {
  optionalNumberInputSchema,
  requiredNumberInputSchema,
} from '../DestinationForm.schema.utils'

const CONNECTION_POOL_SIZE_MIN_ERROR = 'Connection pool size must be greater than 0.'

export const BigQueryFormSchema = z.object({
  projectId: z.string().optional(),
  datasetId: z.string().optional(),
  serviceAccountKey: z.string().optional(),
  connectionPoolSize: requiredNumberInputSchema(
    z
      .number({
        required_error: CONNECTION_POOL_SIZE_MIN_ERROR,
        invalid_type_error: CONNECTION_POOL_SIZE_MIN_ERROR,
      })
      .int()
      .min(1, CONNECTION_POOL_SIZE_MIN_ERROR)
  ),
  maxStalenessMins: optionalNumberInputSchema(
    z
      .number()
      .int('Maximum staleness must be a whole number of minutes.')
      .min(0, 'Maximum staleness must be 0 or greater.')
  ),
})
