import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('useChartHoverState', () => {
  let useChartHoverState: any

  beforeEach(async () => {
    localStorageMock.clear()
    consoleWarnSpy.mockClear()

    vi.resetModules()
    const { useChartHoverState: importedHook } = await import('./useChartHoverState')
    useChartHoverState = importedHook
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useChartHoverState('chart1'))

      expect(result.current.hoveredIndex).toBe(null)
      expect(result.current.syncHover).toBe(true)
      expect(result.current.syncTooltip).toBe(true)
      expect(result.current.hoveredChart).toBe(null)
      expect(result.current.isHovered).toBe(false)
      expect(result.current.isCurrentChart).toBe(false)
    })

    it('should load sync settings from localStorage on initialization', async () => {
      localStorageMock.setItem('supabase-chart-hover-sync-enabled', 'true')
      localStorageMock.setItem('supabase-chart-tooltip-sync-enabled', 'true')

      vi.resetModules()
      const { useChartHoverState: useChartHoverStateWithStorage } = await import(
        './useChartHoverState'
      )

      const { result } = renderHook(() => useChartHoverStateWithStorage('chart1'))

      expect(result.current.syncHover).toBe(true)
      expect(result.current.syncTooltip).toBe(true)
    })

    it('should handle corrupted localStorage data gracefully', async () => {
      localStorageMock.setItem('supabase-chart-hover-sync-enabled', 'invalid-json')
      localStorageMock.setItem('supabase-chart-tooltip-sync-enabled', 'invalid-json')

      vi.resetModules()
      const { useChartHoverState: useChartHoverStateWithCorrupted } = await import(
        './useChartHoverState'
      )

      const { result } = renderHook(() => useChartHoverStateWithCorrupted('chart1'))

      expect(result.current.syncHover).toBe(true)
      expect(result.current.syncTooltip).toBe(true)
      expect(consoleWarnSpy).toHaveBeenCalled()
    })
  })

  describe('hover functionality', () => {
    it('should set hover state locally when sync is disabled', () => {
      const { result } = renderHook(() => useChartHoverState('chart1'))

      act(() => {
        result.current.setHover(5)
      })

      expect(result.current.hoveredIndex).toBe(5)
      expect(result.current.hoveredChart).toBe('chart1')
      expect(result.current.isHovered).toBe(true)
      expect(result.current.isCurrentChart).toBe(true)
    })

    it('should clear hover state locally when sync is disabled', () => {
      const { result } = renderHook(() => useChartHoverState('chart1'))

      act(() => {
        result.current.setHover(5)
      })

      act(() => {
        result.current.clearHover()
      })

      expect(result.current.hoveredIndex).toBe(null)
      expect(result.current.hoveredChart).toBe(null)
      expect(result.current.isHovered).toBe(false)
      expect(result.current.isCurrentChart).toBe(false)
    })

    it('should sync hover state globally when sync is enabled', () => {
      const { result: result1 } = renderHook(() => useChartHoverState('chart1'))
      const { result: result2 } = renderHook(() => useChartHoverState('chart2'))

      act(() => {
        result1.current.setSyncHover(true)
      })
      act(() => {
        result1.current.setHover(3)
      })

      expect(result1.current.hoveredIndex).toBe(3)
      expect(result1.current.hoveredChart).toBe('chart1')
      expect(result1.current.isCurrentChart).toBe(true)

      expect(result2.current.hoveredIndex).toBe(3)
      expect(result2.current.hoveredChart).toBe('chart1')
      expect(result2.current.isCurrentChart).toBe(false)
    })

    it('should clear synced hover state globally', () => {
      const { result: result1 } = renderHook(() => useChartHoverState('chart1'))
      const { result: result2 } = renderHook(() => useChartHoverState('chart2'))

      act(() => {
        result1.current.setSyncHover(true)
        result1.current.setHover(3)
      })
      act(() => {
        result2.current.clearHover()
      })

      expect(result1.current.hoveredIndex).toBe(null)
      expect(result1.current.hoveredChart).toBe(null)
      expect(result2.current.hoveredIndex).toBe(null)
      expect(result2.current.hoveredChart).toBe(null)
    })
  })

  describe('sync settings', () => {
    it('should enable hover sync and save to localStorage', () => {
      const { result } = renderHook(() => useChartHoverState('chart1'))

      act(() => {
        result.current.setSyncHover(true)
      })

      expect(result.current.syncHover).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'supabase-chart-hover-sync-enabled',
        'true'
      )
    })

    it('should disable hover sync and automatically disable tooltip sync', () => {
      const { result } = renderHook(() => useChartHoverState('chart1'))

      act(() => {
        result.current.setSyncTooltip(true)
      })

      expect(result.current.syncHover).toBe(true)
      expect(result.current.syncTooltip).toBe(true)
      act(() => {
        result.current.setSyncHover(false)
      })

      expect(result.current.syncHover).toBe(false)
      expect(result.current.syncTooltip).toBe(false)
    })

    it('should enable tooltip sync and automatically enable hover sync', () => {
      const { result } = renderHook(() => useChartHoverState('chart1'))

      act(() => {
        result.current.setSyncTooltip(true)
      })

      expect(result.current.syncHover).toBe(true)
      expect(result.current.syncTooltip).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'supabase-chart-hover-sync-enabled',
        'true'
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'supabase-chart-tooltip-sync-enabled',
        'true'
      )
    })

    it('should handle localStorage errors gracefully when saving sync settings', () => {
      const { result } = renderHook(() => useChartHoverState('chart1'))

      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded')
      })

      act(() => {
        result.current.setSyncHover(true)
      })

      expect(result.current.syncHover).toBe(true)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to save chart hover sync setting to localStorage:',
        expect.any(Error)
      )
    })
  })

  describe('state synchronization between multiple hooks', () => {
    it('should synchronize state changes between multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useChartHoverState('chart1'))
      const { result: result2 } = renderHook(() => useChartHoverState('chart2'))
      const { result: result3 } = renderHook(() => useChartHoverState('chart3'))

      act(() => {
        result1.current.setSyncHover(true)
      })

      expect(result1.current.syncHover).toBe(true)
      expect(result2.current.syncHover).toBe(true)
      expect(result3.current.syncHover).toBe(true)

      act(() => {
        result2.current.setHover(7)
      })
      expect(result1.current.hoveredIndex).toBe(7)
      expect(result1.current.hoveredChart).toBe('chart2')
      expect(result2.current.hoveredIndex).toBe(7)
      expect(result2.current.hoveredChart).toBe('chart2')
      expect(result3.current.hoveredIndex).toBe(7)
      expect(result3.current.hoveredChart).toBe('chart2')
    })

    it('should correctly identify current chart vs synced charts', () => {
      const { result: result1 } = renderHook(() => useChartHoverState('chart1'))
      const { result: result2 } = renderHook(() => useChartHoverState('chart2'))

      act(() => {
        result1.current.setSyncHover(true)
        result1.current.setHover(5)
      })

      expect(result1.current.isCurrentChart).toBe(true)
      expect(result2.current.isCurrentChart).toBe(false)
      expect(result1.current.isHovered).toBe(true)
      expect(result2.current.isHovered).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle setting hover to null', () => {
      const { result } = renderHook(() => useChartHoverState('chart1'))

      act(() => {
        result.current.setHover(5)
      })

      act(() => {
        result.current.setHover(null)
      })

      expect(result.current.hoveredIndex).toBe(null)
      expect(result.current.hoveredChart).toBe(null)
    })

    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useChartHoverState('chart1'))

      act(() => {
        result.current.setSyncHover(true)
        result.current.setHover(1)
        result.current.setHover(2)
        result.current.setHover(3)
        result.current.clearHover()
        result.current.setHover(4)
      })

      expect(result.current.hoveredIndex).toBe(4)
      expect(result.current.hoveredChart).toBe('chart1')
    })

    it('should not trigger unnecessary state updates when state is the same', () => {
      const { result } = renderHook(() => useChartHoverState('chart1'))

      const initialSyncHover = result.current.syncHover

      act(() => {
        result.current.setSyncHover(initialSyncHover)
      })

      expect(result.current.syncHover).toBe(initialSyncHover)
    })
  })

  describe('helper functions', () => {
    it('should correctly calculate isHovered for current chart', () => {
      const { result } = renderHook(() => useChartHoverState('chart1'))

      expect(result.current.hoveredIndex).toBe(null)
      expect(result.current.isHovered).toBe(false)

      act(() => {
        result.current.setHover(5)
      })

      expect(result.current.hoveredIndex).toBe(5)
      expect(result.current.isHovered).toBe(true)
    })

    it('should correctly calculate isHovered for synced charts', () => {
      const { result: result1 } = renderHook(() => useChartHoverState('chart1'))
      const { result: result2 } = renderHook(() => useChartHoverState('chart2'))

      act(() => {
        result1.current.setSyncHover(true)
        result1.current.setHover(5)
      })

      expect(result1.current.isHovered).toBe(true) // Current chart
      expect(result2.current.isHovered).toBe(true) // Synced chart
    })

    it('should correctly identify current chart', () => {
      const { result: result1 } = renderHook(() => useChartHoverState('chart1'))
      const { result: result2 } = renderHook(() => useChartHoverState('chart2'))

      act(() => {
        result1.current.setSyncHover(true)
        result1.current.setHover(5)
      })

      expect(result1.current.isCurrentChart).toBe(true)
      expect(result2.current.isCurrentChart).toBe(false)
    })
  })
})
