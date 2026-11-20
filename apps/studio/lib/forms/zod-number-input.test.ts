import { describe, expect, it } from 'vitest'
import * as z from 'zod'

import {
  optionalNumberInputSchema,
  preprocessEmptyNumberInput,
  requiredNumberInputSchema,
} from './zod-number-input'

const REQUIRED_ERROR = 'Value is required'

describe('requiredNumberInputSchema', () => {
  const schema = requiredNumberInputSchema(
    z
      .number({
        required_error: REQUIRED_ERROR,
        invalid_type_error: REQUIRED_ERROR,
      })
      .min(1, 'Must be greater than 0')
  )

  it('rejects an empty string with the schema error message', () => {
    const result = schema.safeParse('')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.message).toBe(REQUIRED_ERROR)
  })

  it('leaves undefined to the inner schema', () => {
    const result = schema.safeParse(undefined)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.message).toBe(REQUIRED_ERROR)
  })

  it('accepts a valid number', () => {
    expect(schema.safeParse(2).success).toBe(true)
  })
})

describe('optionalNumberInputSchema', () => {
  const schema = optionalNumberInputSchema(
    z.number().int('Must be a whole number').min(0, 'Must be 0 or greater')
  )

  it.each(['', null, undefined])('normalizes %s to undefined', (value) => {
    const result = schema.safeParse(value)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBeUndefined()
  })

  it('accepts a valid number', () => {
    const result = schema.safeParse(5)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe(5)
  })
})

describe('preprocessEmptyNumberInput', () => {
  const schema = preprocessEmptyNumberInput(
    z.coerce
      .number({ required_error: REQUIRED_ERROR, invalid_type_error: REQUIRED_ERROR })
      .min(0, 'Must be 0 or larger')
  )

  it('rejects an empty string with the schema error message', () => {
    const result = schema.safeParse('')

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.message).toBe(REQUIRED_ERROR)
  })

  it('coerces a numeric string', () => {
    const result = schema.safeParse('12')

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe(12)
  })

  it('accepts an empty string when the inner schema is optional', () => {
    const optionalSchema = preprocessEmptyNumberInput(
      z.coerce
        .number({ required_error: REQUIRED_ERROR, invalid_type_error: REQUIRED_ERROR })
        .min(0, 'Must be 0 or larger')
        .optional()
    )

    const result = optionalSchema.safeParse('')

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBeUndefined()
  })
})
