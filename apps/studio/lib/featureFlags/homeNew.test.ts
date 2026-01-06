import { describe, it, expect } from 'vitest'
import { isHomeNewVariant, type HomeNewFlagValue } from './homeNew'

describe('isHomeNewVariant', () => {
  it('should return true for boolean true', () => {
    expect(isHomeNewVariant(true)).toBe(true)
  })

  it('should return true for string "new-home"', () => {
    expect(isHomeNewVariant('new-home')).toBe(true)
  })

  it('should return false for boolean false', () => {
    expect(isHomeNewVariant(false)).toBe(false)
  })

  it('should return false for string "control"', () => {
    expect(isHomeNewVariant('control')).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isHomeNewVariant(undefined)).toBe(false)
  })

  it('should handle all valid HomeNewFlagValue types', () => {
    const testCases: Array<[HomeNewFlagValue, boolean]> = [
      [true, true],
      ['new-home', true],
      [false, false],
      ['control', false],
      [undefined, false],
    ]

    testCases.forEach(([value, expected]) => {
      expect(isHomeNewVariant(value)).toBe(expected)
    })
  })
})

