import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { CustomTooltip, getStackId } from './ComposedChart.utils'
import type { MultiAttribute, ReferenceZone } from './ComposedChart.utils'
import {
  getHighestCrossedReferenceZone,
  getReferenceZoneRuns,
} from './ComposedChartReferenceZones.utils'
import { getMemoryCommitmentRanges } from '@/data/reports/database-charts.utils'

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

describe('CustomTooltip full commitment capacity', () => {
  const GIB = 1024 ** 3
  const capacity: ReferenceZone = {
    label: 'Full commitment capacity',
    color: 'var(--chart-reference)',
    isAlwaysVisible: true,
    tooltip: '',
    getRanges: (data) => getMemoryCommitmentRanges(data, 1, 1),
  }
  const warning: ReferenceZone = {
    ...capacity,
    label: 'Acknowledgment',
    isAlwaysVisible: false,
    getRanges: (data) => getMemoryCommitmentRanges(data, 0.5, 0.8),
  }
  const data = [
    { period_start: '2026-10-16T10:00:00Z', ram_commit_limit: 5 * GIB, ram_commit_used: 12 * GIB },
    { period_start: '2026-10-16T11:00:00Z', ram_commit_limit: 2 * GIB, ram_commit_used: 6 * GIB },
  ]

  it.each([
    { index: 0, expectedCapacity: '9 GB', expectedUsed: '12 GB' },
    { index: 1, expectedCapacity: '3 GB', expectedUsed: '6 GB' },
  ])(
    'shows the hovered timestamp capacity without adding it to Total at index $index',
    ({ index, expectedCapacity, expectedUsed }) => {
      const point = data[index]
      render(
        createElement(CustomTooltip, {
          active: true,
          isActiveHoveredChart: true,
          showTotal: true,
          data,
          referenceZones: [capacity],
          attributes: [{ attribute: 'ram_commit_used', label: 'Committed' }],
          payload: [
            {
              name: 'ram_commit_used',
              dataKey: 'ram_commit_used',
              value: point.ram_commit_used,
              payload: point,
            },
          ],
        })
      )

      const capacityRow = screen.getByText('Full commitment capacity').parentElement
      expect(capacityRow).toHaveTextContent(expectedCapacity)
      expect(capacityRow?.querySelector('line')).toHaveAttribute('stroke-dasharray')
      expect(screen.getAllByText(expectedUsed)).toHaveLength(2)
      expect(screen.queryByText('Acknowledgment')).not.toBeInTheDocument()
    }
  )

  it.each([
    { index: 0, expectedThreshold: '7.4 GB', expectedCapacity: '9 GB' },
    { index: 1, expectedThreshold: '2.6 GB', expectedCapacity: '3 GB' },
  ])(
    'shows only the selected historical threshold at the hovered capacity at index $index',
    ({ index, expectedThreshold, expectedCapacity }) => {
      const problematic: ReferenceZone = {
        ...warning,
        label: 'Problematic',
        color: 'var(--color-orange-900)',
        getRanges: (data) => getMemoryCommitmentRanges(data, 0.8, 0.9),
      }
      const severe: ReferenceZone = {
        ...warning,
        label: 'Severe',
        getRanges: (data) => getMemoryCommitmentRanges(data, 0.9),
      }
      const history = data.map((point, index) => ({
        ...point,
        ram_commit_used: (index === 0 ? 7.5 : 1.5) * GIB,
      }))
      const zones = [warning, problematic, severe, capacity].map((zone) => ({
        ...zone,
        runs: getReferenceZoneRuns(zone.getRanges(history)),
      }))
      const selectedIndex = getHighestCrossedReferenceZone(history, zones, 'ram_commit_used')
      const visibleZones = zones.filter(
        (zone, index) => zone.isAlwaysVisible || index === selectedIndex
      )
      const point = history[index]
      render(
        createElement(CustomTooltip, {
          active: true,
          isActiveHoveredChart: true,
          showTotal: true,
          data: history,
          referenceZones: visibleZones,
          attributes: [{ attribute: 'ram_commit_used', label: 'Committed' }],
          payload: [
            {
              name: 'ram_commit_used',
              dataKey: 'ram_commit_used',
              value: point.ram_commit_used,
              payload: point,
            },
          ],
        })
      )

      const thresholdRow = screen.getByText('Problematic').parentElement
      expect(thresholdRow).toHaveTextContent(expectedThreshold)
      expect(thresholdRow?.querySelector('line')).toHaveAttribute('stroke-dasharray')
      expect(thresholdRow?.querySelector('line')).toHaveAttribute('stroke', problematic.color)
      expect(screen.getByText('Full commitment capacity').parentElement).toHaveTextContent(
        expectedCapacity
      )
      expect(screen.queryByText('Acknowledgment')).not.toBeInTheDocument()
      expect(screen.queryByText('Severe')).not.toBeInTheDocument()
      expect(screen.getAllByText(index === 0 ? '7.5 GB' : '1.5 GB')).toHaveLength(2)
    }
  )

  it('omits the capacity row when the hovered timestamp has no valid capacity', () => {
    const point = { period_start: '2026-10-16T12:00:00Z', ram_commit_used: 12 * GIB }
    render(
      createElement(CustomTooltip, {
        active: true,
        isActiveHoveredChart: true,
        showTotal: true,
        data: [point],
        referenceZones: [capacity],
        payload: [
          {
            name: 'ram_commit_used',
            dataKey: 'ram_commit_used',
            value: point.ram_commit_used,
            payload: point,
          },
        ],
      })
    )

    expect(screen.queryByText('Full commitment capacity')).not.toBeInTheDocument()
    expect(screen.getAllByText('12 GB')).toHaveLength(2)
  })
})
