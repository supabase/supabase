import * as z from 'zod'

export const requiredNumberInputSchema = (schema: z.ZodNumber) =>
  z.preprocess((value) => (value === '' ? Number.NaN : value), schema)

export const optionalNumberInputSchema = (schema: z.ZodNumber) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())
