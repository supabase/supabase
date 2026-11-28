import { render, screen } from '@testing-library/react'
import { Profiler } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { FilterPopover } from './FilterPopover'

describe('FilterPopover', () => {
  it('does not enter a render loop when activeOptions and options are omitted', () => {
    const onRender = vi.fn()
    const props = {
      name: 'Status',
      valueKey: 'value' as const,
      labelKey: 'label' as const,
      onSaveFilters: vi.fn(),
    } as unknown as Parameters<typeof FilterPopover<{ label: string; value: string }, 'value'>>[0]

    render(
      <Profiler id="filter-popover" onRender={onRender}>
        <FilterPopover {...props} />
      </Profiler>
    )

    expect(screen.getByRole('button', { name: 'Status' })).toBeInTheDocument()
    expect(onRender.mock.calls.length).toBeLessThan(5)
  })

  it('skips redundant state updates when closed and given a fresh equal activeOptions array', () => {
    const onRender = vi.fn()
    const options = [{ label: 'Open', value: 'open' }]

    const { rerender } = render(
      <Profiler id="filter-popover" onRender={onRender}>
        <FilterPopover
          name="Status"
          options={options}
          activeOptions={['open']}
          valueKey="value"
          labelKey="label"
          onSaveFilters={vi.fn()}
        />
      </Profiler>
    )

    const rendersAfterMount = onRender.mock.calls.length

    rerender(
      <Profiler id="filter-popover" onRender={onRender}>
        <FilterPopover
          name="Status"
          options={options}
          activeOptions={['open']}
          valueKey="value"
          labelKey="label"
          onSaveFilters={vi.fn()}
        />
      </Profiler>
    )

    // Only the explicit rerender should commit, without an extra effect-driven re-render.
    expect(onRender.mock.calls.length).toBe(rendersAfterMount + 1)
  })
})
