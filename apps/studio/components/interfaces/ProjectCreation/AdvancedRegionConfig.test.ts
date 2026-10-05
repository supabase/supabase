import { describe, expect, test } from 'vitest'

import {
  parseAdvancedRegionConfigVariant,
  resolveAdvancedRegionConfigVariant,
} from './AdvancedRegionConfig'

describe('parseAdvancedRegionConfigVariant', () => {
  test('returns known variants', () => {
    expect(parseAdvancedRegionConfigVariant('option_a')).toBe('option_a')
    expect(parseAdvancedRegionConfigVariant('control')).toBe('control')
  })

  test('returns undefined for anything else', () => {
    expect(parseAdvancedRegionConfigVariant('option_d')).toBeUndefined()
    expect(parseAdvancedRegionConfigVariant(true)).toBeUndefined()
    expect(parseAdvancedRegionConfigVariant(undefined)).toBeUndefined()
  })
})

describe('resolveAdvancedRegionConfigVariant', () => {
  test('defaults to control', () => {
    expect(
      resolveAdvancedRegionConfigVariant({
        queryParamValue: null,
        flagValue: undefined,
        isProduction: false,
      })
    ).toBe('control')
  })

  test('falls back to control for an unknown flag value', () => {
    expect(
      resolveAdvancedRegionConfigVariant({
        queryParamValue: null,
        flagValue: 'option_z',
        isProduction: false,
      })
    ).toBe('control')
  })

  test('uses the remote flag when there is no override', () => {
    expect(
      resolveAdvancedRegionConfigVariant({
        queryParamValue: null,
        flagValue: 'option_b',
        isProduction: true,
      })
    ).toBe('option_b')
  })

  test('the query param wins outside production', () => {
    expect(
      resolveAdvancedRegionConfigVariant({
        queryParamValue: 'option_c',
        flagValue: 'option_b',
        isProduction: false,
      })
    ).toBe('option_c')
  })

  test('the query param is ignored in production', () => {
    expect(
      resolveAdvancedRegionConfigVariant({
        queryParamValue: 'option_c',
        flagValue: 'option_b',
        isProduction: true,
      })
    ).toBe('option_b')
  })

  test('an unknown query param falls through to the flag', () => {
    expect(
      resolveAdvancedRegionConfigVariant({
        queryParamValue: 'nonsense',
        flagValue: 'option_a',
        isProduction: false,
      })
    ).toBe('option_a')
  })
})
