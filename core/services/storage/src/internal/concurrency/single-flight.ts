export type InvalidatableSingleFlightTask<T> = {
  // Loads a value without publishing it to shared state.
  load(): Promise<T>
  // Re-enters the canonical read path after this generation is detached.
  retry(): Promise<T>
  // Publishes a current result; must not synchronously invalidate the same key.
  commit?(value: T): void
}

export type InvalidatableSingleFlightByKey<T> = {
  (key: string, task: InvalidatableSingleFlightTask<T>): Promise<T>
  invalidate(key: string): boolean
}

// Tenant writes can invalidate locally and again through Postgres notifications.
// Allow a generous burst while still bounding pathological generation churn.
export const MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS = 16

export class SingleFlightInvalidationLimitError extends Error {
  readonly code = 'SINGLE_FLIGHT_INVALIDATION_LIMIT'

  constructor() {
    super(
      `Single-flight invalidation limit of ${MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS} handoffs exceeded`
    )
    this.name = 'SingleFlightInvalidationLimitError'
  }
}

type InvalidatableSingleFlightChain<T> = {
  current?: {
    promise: Promise<T>
    handoff(): void
  }
  handoffs: number
  pendingRejectors: Set<(reason?: unknown) => void>
}

// Deduplicates same-key work while allowing an invalidation to detach the
// current flight. Invalidation schedules detached callers to retry through the
// current read path, joining a replacement flight when one exists. Only a
// current generation can commit its result.
//
// A bounded handoff chain prevents sustained invalidations from keeping callers
// and reloads alive indefinitely.
export function createInvalidatableSingleFlightByKey<T>(): InvalidatableSingleFlightByKey<T> {
  const inFlightMap = new Map<string, InvalidatableSingleFlightChain<T>>()

  const singleFlight = (key: string, task: InvalidatableSingleFlightTask<T>): Promise<T> => {
    let chain = inFlightMap.get(key)
    const inFlight = chain?.current?.promise
    if (inFlight) {
      return inFlight
    }

    if (!chain) {
      chain = { handoffs: 0, pendingRejectors: new Set() }
      inFlightMap.set(key, chain)
    }

    const { promise, resolve, reject } = Promise.withResolvers<T>()
    const clearChainIfIdle = () => {
      if (inFlightMap.get(key) === chain && chain.current === undefined) {
        inFlightMap.delete(key)
      }
    }
    let settled = false
    let handoffStarted = false
    const settleResolve = (value: T) => {
      if (settled) {
        return
      }
      settled = true
      chain.pendingRejectors.delete(settleReject)
      resolve(value)
      clearChainIfIdle()
    }
    const settleReject = (reason?: unknown) => {
      if (settled) {
        return
      }
      settled = true
      chain.pendingRejectors.delete(settleReject)
      reject(reason)
      clearChainIfIdle()
    }
    chain.pendingRejectors.add(settleReject)

    const isCurrent = () => inFlightMap.get(key) === chain && chain.current?.promise === promise
    const clearCurrent = () => {
      if (isCurrent()) {
        inFlightMap.delete(key)
      }
    }
    const retryCurrent = () => {
      if (settled || handoffStarted) {
        return
      }
      handoffStarted = true

      try {
        void task.retry().then(settleResolve, settleReject)
      } catch (error) {
        settleReject(error)
      }
    }
    chain.current = { promise, handoff: retryCurrent }

    const handleSuccess = (value: T) => {
      if (!isCurrent()) {
        retryCurrent()
        return
      }

      try {
        task.commit?.(value)
      } catch (error) {
        clearCurrent()
        settleReject(error)
        return
      }

      clearCurrent()
      settleResolve(value)
    }

    const handleFailure = (error: unknown) => {
      if (!isCurrent()) {
        retryCurrent()
        return
      }

      clearCurrent()
      settleReject(error)
    }

    try {
      void task.load().then(handleSuccess, handleFailure)
    } catch (error) {
      handleFailure(error)
    }

    return promise
  }

  singleFlight.invalidate = (key: string) => {
    const chain = inFlightMap.get(key)
    const current = chain?.current
    if (!chain || !current) {
      return false
    }

    chain.current = undefined
    chain.handoffs++

    if (chain.handoffs > MAX_INVALIDATABLE_SINGLE_FLIGHT_HANDOFFS) {
      const error = new SingleFlightInvalidationLimitError()
      if (inFlightMap.get(key) === chain) {
        inFlightMap.delete(key)
      }
      for (const rejectPending of [...chain.pendingRejectors]) {
        rejectPending(error)
      }
    } else {
      // Cache owners delete their entry in the same synchronous invalidation block.
      queueMicrotask(current.handoff)
    }

    return true
  }

  return singleFlight
}

export function createSingleFlightByKey<T>() {
  const singleFlight = createInvalidatableSingleFlightByKey<T>()

  return (key: string, fn: () => Promise<T>) => {
    return singleFlight(key, { load: fn, retry: fn })
  }
}
