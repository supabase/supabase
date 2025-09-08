import { describe, it, expect } from 'vitest'
import { isNonNullable } from './isNonNullable.js'

describe(`isNonNullable`, () => {
  it.each([
    [null, false],
    [undefined, false],
    // void
    [(() => {})(), false],
    // Truthy
    [`string`, true],
    [1, true],
    [true, true],
    // Falsy
    [``, true],
    [NaN, true],
    [0, true],
    [0, true],
    [false, true],
    // Type coercion
    [[], true],
    [{}, true],
  ])(`correctly matches against nullish values`, (val, expected) => {
    expect(isNonNullable(val)).toStrictEqual(expected)
  })
})
