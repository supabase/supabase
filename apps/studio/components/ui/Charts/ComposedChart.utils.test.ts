import { describe, expect, it } from 'vitest'

import { getStackId } from './ComposedChart.utils'
import type { MultiAttribute } from './ComposedChart.utils'

const attr = (attribute: string, stackId?: string): MultiAttribute => ({ attribute, stackId })

describe('getStackId', () => {
  it('returns the explicit stackId when the attribute configures one', () => {
    const attributes = [attr('ingress', 'traffic'), attr('egress', 'traffic')]
    expect(getStackId(attributes, 'ingress', '1')).toBe('traffic')
    expect(getStackId(attributes, 'egress', '1')).toBe('traffic')
  })

  it('falls back when the attribute has no stackId (overlay case)', () => {
    const attributes = [attr('avg'), attr('min'), attr('max')]
    expect(getStackId(attributes, 'avg', 'avg')).toBe('avg')
    expect(getStackId(attributes, 'min', 'min')).toBe('min')
    expect(getStackId(attributes, 'max', 'max')).toBe('max')
  })

  it('falls back to the shared bar id when no stackId is configured', () => {
    const attributes = [attr('reads'), attr('writes')]
    expect(getStackId(attributes, 'reads', '1')).toBe('1')
    expect(getStackId(attributes, 'writes', '1')).toBe('1')
  })

  it('falls back when the attribute is not found', () => {
    expect(getStackId([attr('reads', 'io')], 'writes', 'fallback')).toBe('fallback')
  })

  it('does not crash on undefined or null attributes', () => {
    expect(getStackId(undefined, 'reads', '1')).toBe('1')
    expect(getStackId(null, 'reads', '1')).toBe('1')
  })

  it('does not crash on undefined or null name', () => {
    expect(getStackId([attr('reads', 'io')], undefined, '1')).toBe('1')
    expect(getStackId([attr('reads', 'io')], null, '1')).toBe('1')
  })

  it('does not crash on falsy entries in the attributes array', () => {
    const attributes: (MultiAttribute | false | null | undefined)[] = [
      false,
      null,
      undefined,
      attr('reads', 'io'),
    ]
    expect(getStackId(attributes, 'reads', '1')).toBe('io')
    expect(getStackId(attributes, 'writes', '1')).toBe('1')
  })

  it('does not crash on a non-array value', () => {
    expect(getStackId('nope' as unknown as MultiAttribute[], 'reads', '1')).toBe('1')
  })

  it('treats an empty-string stackId as configured', () => {
    expect(getStackId([attr('reads', '')], 'reads', '1')).toBe('')
  })
})
