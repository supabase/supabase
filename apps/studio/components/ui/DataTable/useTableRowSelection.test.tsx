import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useTableRowSelection } from './useTableRowSelection'

describe('useTableRowSelection', () => {
  it('restores a linked log and resets when filters or project change', () => {
    const { result, rerender } = renderHook(
      ({ scope }) => useTableRowSelection({ scope, initialId: 'b' }),
      { initialProps: { scope: 'project-1:filters-1' } }
    )
    expect(result.current.selection.selected).toEqual({ b: true })
    act(() => result.current.selectRow(['a', 'b', 'c'], 'c', { shiftKey: true }))
    expect(result.current.selection.selected).toEqual({ b: true, c: true })
    rerender({ scope: 'project-1:filters-1' })
    expect(result.current.selection.selected).toEqual({ b: true, c: true })
    rerender({ scope: 'project-1:filters-2' })
    expect(result.current.selection).toEqual({ selected: {} })
    act(() => result.current.selectRow(['a'], 'a'))
    rerender({ scope: 'project-2:filters-2' })
    expect(result.current.selection).toEqual({ selected: {} })
  })

  it('clears the anchor and selection when closing the pane', () => {
    const { result } = renderHook(() => useTableRowSelection({ scope: 'logs', initialId: 'a' }))
    act(() => result.current.clearSelection())
    expect(result.current.selection).toEqual({ selected: {} })
  })
})
