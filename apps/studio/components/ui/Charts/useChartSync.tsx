import { useCallback, useEffect, useRef, useState } from 'react'

export interface ChartSyncState {
  activeIndex: number | null
  activePayload: any
  activeLabel: string | null
  isHovering: boolean
}

export interface ChartSyncHook {
  syncId: string
  state: ChartSyncState
  updateState: (newState: Partial<ChartSyncState>) => void
  clearState: () => void
  subscribe: (callback: (state: ChartSyncState) => void) => () => void
}

const syncStateMap = new Map<string, ChartSyncState>()
const subscribersMap = new Map<string, Set<(state: ChartSyncState) => void>>()

const getInitialState = (): ChartSyncState => ({
  activeIndex: null,
  activePayload: null,
  activeLabel: null,
  isHovering: false,
})

export function useChartSync(syncId?: string): ChartSyncHook {
  const [state, setState] = useState<ChartSyncState>(getInitialState())
  const isInitialized = useRef(false)

  useEffect(() => {
    if (!syncId) return

    if (!syncStateMap.has(syncId)) {
      syncStateMap.set(syncId, getInitialState())
    }

    if (!subscribersMap.has(syncId)) {
      subscribersMap.set(syncId, new Set())
    }

    setState(syncStateMap.get(syncId) || getInitialState())
    isInitialized.current = true
  }, [syncId])

  useEffect(() => {
    if (!syncId || !isInitialized.current) return

    const subscribers = subscribersMap.get(syncId)!
    const callback = (newState: ChartSyncState) => {
      setState(newState)
    }

    subscribers.add(callback)

    return () => {
      subscribers.delete(callback)
    }
  }, [syncId])

  const updateState = useCallback(
    (newState: Partial<ChartSyncState>) => {
      if (!syncId) return

      const currentState = syncStateMap.get(syncId) || getInitialState()
      const updatedState = { ...currentState, ...newState }

      syncStateMap.set(syncId, updatedState)

      const subscribers = subscribersMap.get(syncId)
      if (subscribers) {
        subscribers.forEach((callback) => callback(updatedState))
      }
    },
    [syncId]
  )

  const clearState = useCallback(() => {
    if (!syncId) return

    const clearedState = getInitialState()
    syncStateMap.set(syncId, clearedState)

    const subscribers = subscribersMap.get(syncId)
    if (subscribers) {
      subscribers.forEach((callback) => callback(clearedState))
    }
  }, [syncId])

  const subscribe = useCallback(
    (callback: (state: ChartSyncState) => void) => {
      if (!syncId) return () => {}

      const subscribers = subscribersMap.get(syncId)!
      subscribers.add(callback)

      return () => {
        subscribers.delete(callback)
      }
    },
    [syncId]
  )

  return {
    syncId: syncId || '',
    state,
    updateState,
    clearState,
    subscribe,
  }
}

export function cleanupChartSync(syncId: string) {
  syncStateMap.delete(syncId)
  subscribersMap.delete(syncId)
}
