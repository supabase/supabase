import { fireEvent, render, screen } from '@testing-library/react'
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ChartBar } from './chart-bar'
import { ChartLine } from './chart-line'

const state = vi.hoisted(() => ({
  reducedMotion: false,
  animations: [] as (boolean | undefined)[],
}))

vi.mock('common', () => ({ useReducedMotion: () => state.reducedMotion }))
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<typeof import('recharts')>()
  return {
    ...original,
    ResponsiveContainer: ({
      children,
    }: {
      children: ReactElement<{ children?: ReactNode; width?: number; height?: number }>
    }) => {
      Children.forEach(children.props.children, (child) => {
        if (
          isValidElement<{ isAnimationActive?: boolean }>(child) &&
          (child.type === original.Area || child.type === original.Bar)
        ) {
          state.animations.push(child.props.isAnimationActive)
        }
      })
      return cloneElement(children, { width: 640, height: 300 })
    },
  }
})

const data = [
  { timestamp: '2026-01-01T00:00:00', value: 2 },
  { timestamp: '2026-01-01T00:01:00', value: 7 },
]

beforeEach(() => {
  state.reducedMotion = false
  state.animations = []
})

describe.each([
  ['ChartLine', ChartLine],
  ['ChartBar', ChartBar],
] as const)('%s accessibility', (_, Chart) => {
  it.each([
    ['with the date range footer', 'timestamp'],
    ['without the date range footer', 'label'],
  ])('allows keyboard navigation %s', (_, xKey) => {
    const chartData = data.map((point) => ({ ...point, label: point.timestamp }))
    render(
      <Chart
        data={chartData}
        xKey={xKey}
        dataKey="value"
        DateTimeFormat="HH:mm"
        showHighlightArea={false}
      />
    )

    if (xKey === 'timestamp') {
      expect(screen.getByText('00:00')).toBeVisible()
      expect(screen.getByText('00:01')).toBeVisible()
    } else {
      expect(screen.queryByText('00:00')).not.toBeInTheDocument()
      expect(screen.queryByText('00:01')).not.toBeInTheDocument()
    }

    const chart = screen.getByRole('application')
    expect(chart).toHaveAttribute('tabindex', '0')
    fireEvent.focus(chart)
    fireEvent.keyDown(chart, { key: 'ArrowRight' })
    expect(screen.getByText('7')).toBeInTheDocument()
    fireEvent.keyDown(chart, { key: 'ArrowLeft' })
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('disables animation when reduced motion is requested', () => {
    state.reducedMotion = true
    render(<Chart data={data} dataKey="value" />)

    expect(state.animations).not.toHaveLength(0)
    expect(state.animations.every((value) => value === false)).toBe(true)
  })

  it('keeps the Recharts animation default otherwise', () => {
    render(<Chart data={data} dataKey="value" />)

    expect(state.animations).not.toHaveLength(0)
    expect(state.animations.every((value) => value === undefined)).toBe(true)
  })
})
