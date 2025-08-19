import * as React from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import debounce from 'lodash/debounce'
import throttle from 'lodash/throttle'

type RealtimeStateError = {
  name: string
  message: string
}

type RealtimeStateOptions<T> = {
  client: SupabaseClient
  channel: string
  initialState: T
  optimisticUpdates?: boolean
  debounceMs?: number
  onError?: (error: RealtimeStateError) => void
  onStateChange?: (newState: T) => void
  merge?: (oldState: T, newState: Partial<T>) => T
  persistence?: {
    save?: (state: Partial<T>) => Promise<void>
    onSaveError?: (error: Error) => void
    debounceMs?: number
    keys?: (keyof T)[]
    strategy?: 'debounce' | 'throttle' | 'immediate'
  }
}

export function useRealtimeState<T extends Record<string, any>>(options: RealtimeStateOptions<T>) {
  const [state, setLocalState] = React.useState<T>(options.initialState)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<RealtimeStateError | null>(null)

  const merge = options.merge || ((old: T, new_: Partial<T>) => ({ ...old, ...new_ }))

  // Debounced state updates to prevent rapid-fire updates
  const debouncedSetState = React.useMemo(
    () =>
      debounce(
        (newState: Partial<T>) => {
          options.client.channel(options.channel).send({
            type: 'broadcast',
            event: 'state_change',
            payload: newState,
          })
        },
        options.debounceMs || 100,
        { leading: true, trailing: true }
      ),
    [options.channel, options.client, options.debounceMs]
  )

  // Setup persistence handler
  const persistState = React.useMemo(() => {
    const persistence = options.persistence
    if (!persistence?.save) return null

    const handler = async (state: Partial<T>) => {
      try {
        if (!persistence.keys) {
          await persistence.save?.(state)
          return
        }

        const dataToSave = Object.fromEntries(
          persistence.keys.map((key) => [key, state[key]])
        ) as Partial<T>

        await persistence.save?.(dataToSave)
      } catch (error) {
        persistence.onSaveError?.(error as Error)
      }
    }

    const debounceMs = persistence.debounceMs ?? 1000

    switch (persistence.strategy) {
      case 'throttle':
        return throttle(handler, debounceMs, { leading: true, trailing: true })
      case 'immediate':
        return handler
      default:
        return debounce(handler, debounceMs, { leading: true, trailing: true })
    }
  }, [options.persistence])

  // Enhanced setState with optimistic updates and persistence
  const setState = React.useCallback(
    (newState: Partial<T> | ((prev: T) => Partial<T>)) => {
      const update = typeof newState === 'function' ? newState(state) : newState

      if (options.optimisticUpdates) {
        setLocalState((prev) => merge(prev, update))
      }

      // Persist state if configured
      persistState?.(update)

      // Broadcast state
      debouncedSetState(update)
    },
    [state, options.optimisticUpdates, debouncedSetState, persistState, merge]
  )

  React.useEffect(() => {
    const channel = options.client.channel(options.channel)

    channel
      .on('broadcast', { event: 'state_change' }, ({ payload }) => {
        setLocalState((prev) => merge(prev, payload))
        options.onStateChange?.(payload)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLoading(false)
        }
      })
      .on('broadcast', { event: 'error' }, (error) => {
        setError({ name: 'RealtimeStateError', message: error.payload.error })
        options.onError?.({ name: 'RealtimeStateError', message: error.payload.error })
      })

    return () => {
      channel.unsubscribe()
    }
  }, [options.channel, options.client, merge, options.onStateChange, options.onError])

  return {
    state,
    setState,
    isLoading,
    error,
    reset: () => setLocalState(options.initialState),
  }
}
