import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { CustomTooltip, getStackId } from './ComposedChart.utils'
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

describe('CustomTooltip reference zones', () => {
  const GIB = 1024 ** 3
  const point = {
    period_start: '2026-10-15T12:00:00.000Z',
    ram_commit_used: 4 * GIB,
  }
  const zoneEntry = {
    name: 'Extreme hazard',
    dataKey: 'reference-zone-0',
    type: 'none',
    value: [8.2 * GIB, 9 * GIB],
    payload: point,
  }

  it('omits reference zone rows and excludes their ranges from the total', () => {
    render(
      createElement(CustomTooltip, {
        active: true,
        isActiveHoveredChart: true,
        showTotal: true,
        attributes: [{ attribute: 'ram_commit_used', label: 'Committed' }],
        data: [point],
        payload: [
          zoneEntry,
          {
            name: 'ram_commit_used',
            dataKey: 'ram_commit_used',
            type: 'square',
            value: point.ram_commit_used,
            color: 'var(--chart-1)',
            payload: point,
          },
        ],
      })
    )

    expect(screen.getByText('Committed')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getAllByText('4 GB')).toHaveLength(2)
    expect(screen.queryByText('Extreme hazard')).not.toBeInTheDocument()
  })

  it('renders no tooltip when only reference zones remain', () => {
    const { container } = render(
      createElement(CustomTooltip, {
        active: true,
        isActiveHoveredChart: true,
        showTotal: true,
        payload: [zoneEntry],
      })
    )

    expect(container).toBeEmptyDOMElement()
  })
})
