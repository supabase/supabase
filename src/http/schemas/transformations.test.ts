import Ajv from 'ajv'
import { describe, expect, it } from 'vitest'
import { finiteKeyword } from '../finite'
import { transformationOptionsSchema } from './transformations'

describe('transformationOptionsSchema', () => {
  const ajv = new Ajv({
    allErrors: true,
    coerceTypes: true,
  })
  ajv.addKeyword(finiteKeyword)
  const validate = ajv.compile(transformationOptionsSchema)

  it.each([
    {},
    { width: 100, height: 100, resize: 'cover' },
    { gravity: 'sm' },
    { gravity: 'sm', x_offset: 12, y_offset: -4 },
    { gravity: 'ce' },
    { gravity: 'no', x_offset: 12, y_offset: -4 },
    { gravity: 'noea', x_offset: 0.25, y_offset: 0.75 },
    { gravity: 'fp', x_offset: 0, y_offset: 1 },
    { gravity: 'fp', x_offset: 0.5, y_offset: 0.75 },
    { x_offset: 0.5, y_offset: 0.5 },
  ])('accepts %j', (value) => {
    expect(validate(value)).toBe(true)
  })

  it.each([
    [{ gravity: 'fp' }, /x_offset|y_offset/],
    [{ gravity: 'fp', x_offset: 0.5 }, /y_offset/],
    [{ gravity: 'fp', x_offset: 1.1, y_offset: 0.5 }, /x_offset|<=/],
    [{ gravity: 'fp', x_offset: -0.1, y_offset: 0.5 }, /x_offset|>=/],
    [{ gravity: 'obj' }, /gravity/],
    [{ x_offset: Number.POSITIVE_INFINITY }, /finite|x_offset/],
  ])('rejects %j', (value, message) => {
    expect(validate(value)).toBe(false)
    expect(ajv.errorsText(validate.errors)).toMatch(message)
  })
})
