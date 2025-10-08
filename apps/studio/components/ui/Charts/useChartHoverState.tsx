import { useCallback, useEffect, useState } from 'react'

interface ChartHoverState {
  hoveredIndex: number | null
  hoveredChart: string | null
  syncHover: boolean
  syncTooltip: boolean
}

const CHART_HOVER_SYNC_STORAGE_KEY = 'supabase-chart-hover-sync-enabled'
const CHART_TOOLTIP_SYNC_STORAGE_KEY = 'supabase-chart-tooltip-sync-enabled'

// Global state shared across all hook instances
let globalState: ChartHoverState = {
  hoveredIndex: null,
  hoveredChart: null,
  syncHover: true,
  syncTooltip: true,
}

// Subscribers for state changes
const subscribers = new Set<(state: ChartHoverState) => void>()

// Load initial sync settings from localStorage
try {
  if (typeof window !== 'undefined') {
    const hoverSyncStored = localStorage.getItem(CHART_HOVER_SYNC_STORAGE_KEY)
    const tooltipSyncStored = localStorage.getItem(CHART_TOOLTIP_SYNC_STORAGE_KEY)

    if (hoverSyncStored !== null) {
      globalState.syncHover = JSON.parse(hoverSyncStored)
    }
    if (tooltipSyncStored !== null) {
      globalState.syncTooltip = JSON.parse(tooltipSyncStored)
    }
  }
} catch (error) {
  console.warn('Failed to load chart sync settings from localStorage:', error)
}

function notifySubscribers() {
  subscribers.forEach((callback) => callback(globalState))
}

function updateGlobalState(updates: Partial<ChartHoverState>) {
  const prevState = globalState
  globalState = { ...globalState, ...updates }

  // Save sync settings to localStorage when they change
  if (updates.syncHover !== undefined) {
    try {
      localStorage.setItem(CHART_HOVER_SYNC_STORAGE_KEY, JSON.stringify(globalState.syncHover))
    } catch (error) {
      console.warn('Failed to save chart hover sync setting to localStorage:', error)
    }
  }
  if (updates.syncTooltip !== undefined) {
    try {
      localStorage.setItem(CHART_TOOLTIP_SYNC_STORAGE_KEY, JSON.stringify(globalState.syncTooltip))
    } catch (error) {
      console.warn('Failed to save chart tooltip sync setting to localStorage:', error)
    }
  }

  // Only notify if state actually changed
  if (JSON.stringify(prevState) !== JSON.stringify(globalState)) {
    notifySubscribers()
  }
}

export function useChartHoverState(chartId: string) {
  const [state, setState] = useState<ChartHoverState>(globalState)

  // Subscribe to global state changes
  useEffect(() => {
    const callback = (newState: ChartHoverState) => {
      setState(newState)
    }

    subscribers.add(callback)

    return () => {
      subscribers.delete(callback)
    }
  }, [])

  // Set hover state for this chart
  const setHover = useCallback(
    (index: number | null) => {
      if (globalState.syncHover) {
        // If sync is enabled, update global state
        updateGlobalState({
          hoveredIndex: index,
          hoveredChart: index !== null ? chartId : null,
        })
      } else {
        // If sync is disabled, only update local state
        setState((prev) => ({
          ...prev,
          hoveredIndex: index,
          hoveredChart: index !== null ? chartId : null,
        }))
      }
    },
    [chartId]
  )

  // Clear hover state
  const clearHover = useCallback(() => {
    if (globalState.syncHover) {
      updateGlobalState({
        hoveredIndex: null,
        hoveredChart: null,
      })
    } else {
      setState((prev) => ({
        ...prev,
        hoveredIndex: null,
        hoveredChart: null,
      }))
    }
  }, [])

  // Set sync settings (for settings component)
  const setSyncHover = useCallback((enabled: boolean) => {
    updateGlobalState({
      syncHover: enabled,
      // If turning off hover sync, also turn off tooltip sync
      ...(enabled === false && { syncTooltip: false }),
    })
  }, [])

  const setSyncTooltip = useCallback((enabled: boolean) => {
    updateGlobalState({
      syncTooltip: enabled,
      // If turning on tooltip sync, also turn on hover sync
      ...(enabled === true && { syncHover: true }),
    })
  }, [])

  // Determine if this chart should show synced state
  const isCurrentChart = state.hoveredChart === chartId
  const shouldShowSyncedState = state.syncHover && state.hoveredChart !== null && !isCurrentChart

  return {
    // Current state
    hoveredIndex: shouldShowSyncedState
      ? state.hoveredIndex
      : isCurrentChart
        ? state.hoveredIndex
        : null,
    syncHover: state.syncHover,
    syncTooltip: state.syncTooltip,
    hoveredChart: state.hoveredChart,

    // Actions
    setHover,
    clearHover,
    setSyncHover,
    setSyncTooltip,

    // Helpers
    isHovered: state.hoveredIndex !== null && (isCurrentChart || shouldShowSyncedState),
    isCurrentChart,
  }
}
