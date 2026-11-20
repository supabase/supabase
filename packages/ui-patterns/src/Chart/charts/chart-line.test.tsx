import { fireEvent, render, screen } from '@testing-library/react'
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
          child.type === original.Area
        ) {
          state.animations.push(child.props.isAnimationActive)
        }
      })
      return cloneElement(children, { width: 640, height: 300 })
    },
  }
})

const data = [
  { timestamp: '2026-01-01T00:00:00Z', value: 2 },
  { timestamp: '2026-01-01T00:01:00Z', value: 7 },
]

beforeEach(() => {
  state.reducedMotion = false
  state.animations = []
})

describe('ChartLine accessibility', () => {
  it('allows keyboard users to move between measurements', () => {
    render(<ChartLine data={data} dataKey="value" showHighlightArea={false} />)

    const chart = screen.getByRole('application')
    expect(chart).toHaveAttribute('tabindex', '0')
    fireEvent.focus(chart)
    fireEvent.keyDown(chart, { key: 'ArrowRight' })
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('disables area animation when reduced motion is requested', () => {
    state.reducedMotion = true
    render(<ChartLine data={data} dataKey="value" />)

    expect(state.animations).not.toHaveLength(0)
    expect(state.animations.every((value) => value === false)).toBe(true)
  })

  it('keeps the Recharts animation default otherwise', () => {
    render(<ChartLine data={data} dataKey="value" />)

    expect(state.animations).not.toHaveLength(0)
    expect(state.animations.every((value) => value === undefined)).toBe(true)
  })
})
