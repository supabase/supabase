import { AsyncAbortController } from '@internal/concurrency'
import { vi } from 'vitest'

describe('AsyncAbortController', () => {
  it('reuses nextGroup when accessed repeatedly', () => {
    const controller = new AsyncAbortController()

    const firstGroup = controller.nextGroup
    const secondGroup = controller.nextGroup

    expect(secondGroup).toBe(firstGroup)
  })

  it('reuses nested nextGroup access at each level', () => {
    const controller = new AsyncAbortController()
    const firstGroup = controller.nextGroup

    const firstNestedGroup = controller.nextGroup.nextGroup
    const secondNestedGroup = controller.nextGroup.nextGroup

    expect(controller.nextGroup).toBe(firstGroup)
    expect(secondNestedGroup).toBe(firstNestedGroup)
    expect(firstNestedGroup).toBe(firstGroup.nextGroup)
  })

  it('aborts a nextGroup child only once even after repeated access', async () => {
    const controller = new AsyncAbortController()
    const childGroup = controller.nextGroup
    const abortSpy = vi.spyOn(childGroup, 'abortAsync').mockResolvedValue(undefined)

    void controller.nextGroup
    void controller.nextGroup

    await controller.abortAsync()

    expect(abortSpy).toHaveBeenCalledTimes(1)
  })

  it('waits for parent abort handlers before aborting nested groups', async () => {
    const controller = new AsyncAbortController()
    const childGroup = controller.nextGroup
    const grandchildGroup = childGroup.nextGroup
    const order: string[] = []
    let releaseRootAbort!: () => void
    const rootAbortDone = new Promise<void>((resolve) => {
      releaseRootAbort = resolve
    })

    controller.signal.addEventListener('abort', async () => {
      order.push('root:start')
      await rootAbortDone
      order.push('root:end')
    })

    childGroup.signal.addEventListener('abort', () => {
      order.push('child')
    })

    grandchildGroup.signal.addEventListener('abort', () => {
      order.push('grandchild')
    })

    const abortPromise = controller.abortAsync()

    await Promise.resolve() // force microtask tick
    expect(order).toEqual(['root:start'])

    releaseRootAbort()
    await abortPromise

    expect(order).toEqual(['root:start', 'root:end', 'child', 'grandchild'])
  })

  it('forwards the real abort event to function listeners with the signal as context', async () => {
    const controller = new AsyncAbortController()
    const seen: {
      target: EventTarget | null
      currentTarget: EventTarget | null
      context: unknown
    } = {
      target: null,
      currentTarget: null,
      context: undefined,
    }

    controller.signal.addEventListener('abort', function (event) {
      seen.target = event.target
      seen.currentTarget = event.currentTarget
      seen.context = this
    })

    await controller.abortAsync()

    expect(seen.target).toBe(controller.signal)
    expect(seen.currentTarget).toBe(controller.signal)
    expect(seen.context).toBe(controller.signal)
  })

  it('waits for handleEvent listeners before aborting nested groups', async () => {
    const controller = new AsyncAbortController()
    const childGroup = controller.nextGroup
    const order: string[] = []
    let releaseRootAbort!: () => void
    const rootAbortDone = new Promise<void>((resolve) => {
      releaseRootAbort = resolve
    })
    const listener = {
      target: null as EventTarget | null,
      async handleEvent(event: Event) {
        this.target = event.target
        order.push('root:start')
        await rootAbortDone
        order.push('root:end')
      },
    }

    controller.signal.addEventListener('abort', listener)
    childGroup.signal.addEventListener('abort', () => {
      order.push('child')
    })

    const abortPromise = controller.abortAsync()

    await Promise.resolve()
    expect(order).toEqual(['root:start'])

    releaseRootAbort()
    await abortPromise

    expect(listener.target).toBe(controller.signal)
    expect(order).toEqual(['root:start', 'root:end', 'child'])
  })

  it('ignores null abort listeners', async () => {
    const controller = new AsyncAbortController()
    const nullListener = null as unknown as EventListenerOrEventListenerObject

    expect(() => controller.signal.addEventListener('abort', nullListener)).not.toThrow()
    await expect(controller.abortAsync()).resolves.toBeUndefined()
  })

  it('does not invoke or wait on explicitly removed abort listeners', async () => {
    const controller = new AsyncAbortController()
    const listener = vi.fn()

    controller.signal.addEventListener('abort', listener)
    controller.signal.removeEventListener('abort', listener)

    await expect(controller.abortAsync()).resolves.toBeUndefined()
    expect(listener).not.toHaveBeenCalled()
  })

  it('does not invoke or wait on abort listeners removed by a registration signal', async () => {
    const controller = new AsyncAbortController()
    const registration = new AbortController()
    const listener = vi.fn()

    controller.signal.addEventListener('abort', listener, {
      signal: registration.signal,
    })

    registration.abort()

    await expect(controller.abortAsync()).resolves.toBeUndefined()
    expect(listener).not.toHaveBeenCalled()
  })

  it('ignores abort listeners registered with an already aborted signal', async () => {
    const controller = new AsyncAbortController()
    const registration = new AbortController()
    const listener = vi.fn()

    registration.abort()
    controller.signal.addEventListener('abort', listener, {
      signal: registration.signal,
    })

    await expect(controller.abortAsync()).resolves.toBeUndefined()
    expect(listener).not.toHaveBeenCalled()
  })
})
