import * as z from 'zod'

// This validator validates a string to be a positive integer or if it's an empty string, transforms it to a null
export const StringToPositiveNumber = z.union([
  // parse the value if it's a number
  z.number().positive().int(),
  // parse the value if it's a non-empty string
  z.string().min(1).pipe(z.coerce.number().positive().int()),
  // transform a non-empty string into a null value
  z
    .string()
    .max(0, 'The field accepts only a number')
    .transform((v) => null),
  z.null(),
])

export const StringNumberOrNull = z
  .string()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine((value) => value === null || !isNaN(Number(value)), {
    message: 'Invalid number',
  })
  .transform((value) => (value === null ? null : Number(value)))
