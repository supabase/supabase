import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { debounce } from './helpers'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('invokes the trailing call with the arguments from the most recent call', () => {
    const spy = vi.fn()
    const debounced = debounce(spy, 100)

    debounced('a')
    debounced('b')

    vi.advanceTimersByTime(100)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('b')
  })

  it('forwards all arguments to a single trailing invocation', () => {
    const spy = vi.fn()
    const debounced = debounce(spy, 50)

    debounced(1, 2, 3)

    vi.advanceTimersByTime(50)

    expect(spy).toHaveBeenCalledWith(1, 2, 3)
  })

  it('passes the latest arguments on the leading edge as well', () => {
    const spy = vi.fn()
    const debounced = debounce(spy, 100, { leading: true, trailing: false })

    debounced('first')

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('first')
  })

  it('does not invoke after cancel()', () => {
    const spy = vi.fn()
    const debounced = debounce(spy, 100)

    debounced('x')
    debounced.cancel()

    vi.advanceTimersByTime(100)

    expect(spy).not.toHaveBeenCalled()
  })
})
