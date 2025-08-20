import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useChartSync, cleanupChartSync } from './useChartSync'

describe('useChartSync', () => {
  beforeEach(() => {
    cleanupChartSync('test-sync-1')
    cleanupChartSync('test-sync-2')
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useChartSync('test-sync-1'))

    expect(result.current.state).toEqual({
      activeIndex: null,
      activePayload: null,
      activeLabel: null,
      isHovering: false,
    })
  })

  it('should update state correctly', () => {
    const { result } = renderHook(() => useChartSync('test-sync-1'))

    act(() => {
      result.current.updateState({
        activeIndex: 5,
        activePayload: { test: 'data' },
        activeLabel: 'test-label',
        isHovering: true,
      })
    })

    expect(result.current.state).toEqual({
      activeIndex: 5,
      activePayload: { test: 'data' },
      activeLabel: 'test-label',
      isHovering: true,
    })
  })

  it('should clear state correctly', () => {
    const { result } = renderHook(() => useChartSync('test-sync-1'))

    // First update the state
    act(() => {
      result.current.updateState({
        activeIndex: 5,
        activePayload: { test: 'data' },
        activeLabel: 'test-label',
        isHovering: true,
      })
    })

    // Then clear it
    act(() => {
      result.current.clearState()
    })

    expect(result.current.state).toEqual({
      activeIndex: null,
      activePayload: null,
      activeLabel: null,
      isHovering: false,
    })
  })

  it('should sync state between multiple hooks with same syncId', () => {
    const { result: result1 } = renderHook(() => useChartSync('test-sync-1'))
    const { result: result2 } = renderHook(() => useChartSync('test-sync-1'))

    act(() => {
      result1.current.updateState({
        activeIndex: 10,
        activePayload: { test: 'data' },
        activeLabel: 'test-label',
        isHovering: true,
      })
    })

    // Both hooks should have the same state
    expect(result1.current.state.activeIndex).toBe(10)
    expect(result2.current.state.activeIndex).toBe(10)
  })

  it('should not sync state between hooks with different syncId', () => {
    const { result: result1 } = renderHook(() => useChartSync('test-sync-1'))
    const { result: result2 } = renderHook(() => useChartSync('test-sync-2'))

    act(() => {
      result1.current.updateState({
        activeIndex: 10,
        activePayload: { test: 'data' },
        activeLabel: 'test-label',
        isHovering: true,
      })
    })

    // Only the first hook should have updated state
    expect(result1.current.state.activeIndex).toBe(10)
    expect(result2.current.state.activeIndex).toBe(null)
  })

  it('should handle partial state updates', () => {
    const { result } = renderHook(() => useChartSync('test-sync-1'))

    // Set initial state
    act(() => {
      result.current.updateState({
        activeIndex: 5,
        activePayload: { test: 'data' },
        activeLabel: 'test-label',
        isHovering: true,
      })
    })

    // Update only some fields
    act(() => {
      result.current.updateState({
        activeIndex: 10,
        isHovering: false,
      })
    })

    expect(result.current.state).toEqual({
      activeIndex: 10,
      activePayload: { test: 'data' },
      activeLabel: 'test-label',
      isHovering: false,
    })
  })

  it('should handle undefined syncId', () => {
    const { result } = renderHook(() => useChartSync(undefined))

    act(() => {
      result.current.updateState({
        activeIndex: 5,
        activePayload: { test: 'data' },
        activeLabel: 'test-label',
        isHovering: true,
      })
    })

    // State should remain unchanged when syncId is undefined
    expect(result.current.state).toEqual({
      activeIndex: null,
      activePayload: null,
      activeLabel: null,
      isHovering: false,
    })
  })
})
