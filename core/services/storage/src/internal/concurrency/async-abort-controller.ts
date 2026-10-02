/**
 * This special AbortController is used to wait for all the abort handlers to finish before resolving the promise.
 */
type AbortListener = EventListenerOrEventListenerObject

type ListenerRecord = {
  wrapped: EventListener
  cleanup: () => void
}

export class AsyncAbortController extends AbortController {
  protected runningPromises = new Set<Promise<void>>()
  protected abortListeners = new WeakMap<AbortListener, Map<boolean, ListenerRecord>>()
  protected _nextGroup?: AsyncAbortController

  constructor() {
    super()

    const originalAddEventListener = this.signal.addEventListener.bind(this.signal)
    const originalRemoveEventListener = this.signal.removeEventListener.bind(this.signal)

    // Patch event addEventListener to keep track of listeners and their promises
    this.signal.addEventListener = (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
    ) => {
      if (!listener) {
        return
      }

      if (type !== 'abort') {
        return originalAddEventListener(type, listener, options)
      }

      if (this.signal.aborted) {
        return originalAddEventListener(type, listener, options)
      }

      const capture = getCaptureOption(options)
      const existingRecord = this.getAbortListenerRecord(listener, capture)
      if (existingRecord) {
        return originalAddEventListener(type, existingRecord.wrapped, options)
      }

      const registrationSignal = getRegistrationSignal(options)
      if (registrationSignal?.aborted) {
        return
      }

      let wrapped!: EventListener
      const cleanupRegistrationSignal = this.watchListenerRemovalSignal(
        registrationSignal,
        listener,
        capture
      )

      wrapped = (event: Event) => {
        this.deleteAbortListenerRecord(listener, capture)
        originalRemoveEventListener(type, wrapped, capture)

        const runningPromise = this.invokeAbortListener(listener, event)
        this.runningPromises.add(runningPromise)
        void runningPromise.finally(() => {
          this.runningPromises.delete(runningPromise)
        })
      }

      this.setAbortListenerRecord(listener, capture, {
        wrapped,
        cleanup: cleanupRegistrationSignal,
      })

      return originalAddEventListener(type, wrapped, options)
    }

    this.signal.removeEventListener = (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions
    ) => {
      if (!listener) {
        return
      }

      if (type !== 'abort') {
        return originalRemoveEventListener(type, listener, options)
      }

      const capture = getCaptureOption(options)
      const record = this.getAbortListenerRecord(listener, capture)
      if (!record) {
        return originalRemoveEventListener(type, listener, options)
      }

      this.deleteAbortListenerRecord(listener, capture)
      return originalRemoveEventListener(type, record.wrapped, options)
    }
  }

  get nextGroup() {
    if (this._nextGroup) {
      return this._nextGroup
    }

    this._nextGroup = new AsyncAbortController()
    return this._nextGroup
  }

  async abortAsync() {
    this.abort()
    while (this.runningPromises.size > 0) {
      const promises = Array.from(this.runningPromises)
      await Promise.allSettled(promises)
    }
    await this.abortNextGroup()
  }

  protected async abortNextGroup() {
    if (this._nextGroup) {
      await this._nextGroup.abortAsync()
    }
  }

  protected invokeAbortListener(listener: AbortListener, event: Event): Promise<void> {
    try {
      const result =
        typeof listener === 'function'
          ? listener.call(this.signal, event)
          : listener.handleEvent(event)

      return Promise.resolve(result).then(() => undefined)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  protected getAbortListenerRecord(
    listener: AbortListener,
    capture: boolean
  ): ListenerRecord | undefined {
    return this.abortListeners.get(listener)?.get(capture)
  }

  protected setAbortListenerRecord(
    listener: AbortListener,
    capture: boolean,
    record: ListenerRecord
  ) {
    const records = this.abortListeners.get(listener) ?? new Map<boolean, ListenerRecord>()
    records.set(capture, record)
    this.abortListeners.set(listener, records)
  }

  protected deleteAbortListenerRecord(listener: AbortListener, capture: boolean) {
    const records = this.abortListeners.get(listener)
    const record = records?.get(capture)
    if (!records || !record) {
      return
    }

    record.cleanup()
    records.delete(capture)

    if (records.size === 0) {
      this.abortListeners.delete(listener)
    }
  }

  protected watchListenerRemovalSignal(
    signal: AbortSignal | undefined,
    listener: AbortListener,
    capture: boolean
  ): () => void {
    if (!signal) {
      return () => {}
    }

    const onAbort = () => {
      this.deleteAbortListenerRecord(listener, capture)
    }

    addNativeEventListener(signal, 'abort', onAbort, { once: true })

    return () => {
      removeNativeEventListener(signal, 'abort', onAbort, { capture: false })
    }
  }
}

const nativeAddEventListener = EventTarget.prototype.addEventListener
const nativeRemoveEventListener = EventTarget.prototype.removeEventListener

function addNativeEventListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
) {
  nativeAddEventListener.call(target, type, listener, options)
}

function removeNativeEventListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions
) {
  nativeRemoveEventListener.call(target, type, listener, options)
}

function getCaptureOption(options?: boolean | EventListenerOptions): boolean {
  if (typeof options === 'boolean') {
    return options
  }

  return options?.capture ?? false
}

function getRegistrationSignal(
  options?: boolean | AddEventListenerOptions
): AbortSignal | undefined {
  if (typeof options === 'boolean') {
    return undefined
  }

  return options?.signal
}
