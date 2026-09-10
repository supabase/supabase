import * as z from 'zod'

export const isEmptyNumberInput = (value: unknown) => value === '' || value == null

/**
 * Wraps a zod number schema so an empty controlled input (`''`) fails validation with the
 * schema's `invalid_type_error` instead of snapping back to the previous value.
 */
export const requiredNumberInputSchema = (schema: z.ZodNumber) =>
  z.preprocess((value) => (value === '' ? Number.NaN : value), schema)

/**
 * Wraps a zod number schema so an empty controlled input (`''` or `null`) normalizes to
 * `undefined` before validation.
 */
export const optionalNumberInputSchema = (schema: z.ZodNumber) =>
  z.preprocess((value) => (isEmptyNumberInput(value) ? undefined : value), schema.optional())

/**
 * Normalizes empty controlled number inputs (`''` or `null`) to `undefined` before running
 * the inner schema. Useful with `z.coerce.number()` in auth and settings forms.
 */
export const preprocessEmptyNumberInput = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (isEmptyNumberInput(value) ? undefined : value), schema)
