import * as z from 'zod'

export const optionalNumberInputSchema = (schema: z.ZodNumber) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())
