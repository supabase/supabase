import { describe, expect, it } from 'vitest'

import { getPaddedCounterValue } from './AnimatedCounter'

describe('getPaddedCounterValue', () => {
  describe('percentages', () => {
    it('zero-pads a positive value to the width of the target', () => {
      expect(getPaddedCounterValue(2, 13.4, true)).toBe('02.0%')
    })

    it('keeps the padding zeros after the minus sign for negative values (regression)', () => {
      // Previously the whole signed string was padded, so the zero landed
      // before the minus sign and produced "0-2.0%".
      expect(getPaddedCounterValue(-2, -13.4, true)).toBe('-02.0%')
      expect(getPaddedCounterValue(-2, -13.4, true)).not.toContain('0-2.0')
    })

    it('does not pad once the value reaches the target width', () => {
      expect(getPaddedCounterValue(-13.4, -13.4, true)).toBe('-13.4%')
      expect(getPaddedCounterValue(-2, -2, true)).toBe('-2.0%')
    })

    it('shows a plus prefix for positive values when prefix is set', () => {
      expect(getPaddedCounterValue(5, 13.4, true, '+')).toBe('+05.0%')
    })
  })

  describe('plain numbers', () => {
    it('returns the comma-formatted value when no padding is needed', () => {
      expect(getPaddedCounterValue(230550, 230550, false)).toBe('230,550')
    })

    it('zero-pads to the target digit count and preserves commas', () => {
      expect(getPaddedCounterValue(550, 230550, false)).toBe('000,550')
    })
  })
})
