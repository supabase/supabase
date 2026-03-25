import * as z from 'zod'

export const StringNumberOrNull = z
  .string()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .refine((value) => value === null || !isNaN(Number(value)), {
    message: 'Invalid number',
  })
  .transform((value) => (value === null ? null : Number(value)))

/**
 * [Joshen] After wrangling with RHF I think this is the easiest way to handle nullable number fields
 * - Declare the field normally as you would in the zod form schema (e.g field: z.number().nullable())
 * - In the InputField, add a form.register call `{...form.register('field_name', { setValueAs: setValueAsNullableNumber })}`
 */
export const setValueAsNullableNumber = (v: any) => (v === '' || v === null ? null : parseInt(v))
