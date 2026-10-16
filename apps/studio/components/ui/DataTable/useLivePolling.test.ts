import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LIVE_MODE_IDLE_TIMEOUT_MS } from './LiveButton.utils'
import { useLivePolling } from './useLivePolling'

const SECOND = 1_000
const MINUTE = 60 * SECOND

const pageResult = (rows: unknown[]) => ({ data: { pages: [{ data: rows }] } })
const NEW_ROWS = pageResult([{ id: 'a' }])
const NO_ROWS = pageResult([])

let visibilityState: DocumentVisibilityState = 'visible'

const setVisibility = async (state: DocumentVisibilityState) => {
  visibilityState = state
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

const interact = async () => {
  await act(async () => {
    window.dispatchEvent(new Event('pointerdown'))
  })
}

const setup = ({ result = NEW_ROWS, isEnabled = true } = {}) => {
  const poll = vi.fn(() => Promise.resolve(result))
  const onIdle = vi.fn()
  const hook = renderHook(
    (props: { isEnabled: boolean }) => useLivePolling({ isEnabled: props.isEnabled, poll, onIdle }),
    { initialProps: { isEnabled } }
  )
  return { poll, onIdle, hook }
}

describe('useLivePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    visibilityState = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibilityState)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('polls immediately, then every 10 seconds while polls find rows', async () => {
    const { poll } = setup()
    await advance(0)
    expect(poll).toHaveBeenCalledTimes(1)

    await advance(9 * SECOND)
    expect(poll).toHaveBeenCalledTimes(1)
    await advance(1 * SECOND)
    expect(poll).toHaveBeenCalledTimes(2)
    await advance(10 * SECOND)
    expect(poll).toHaveBeenCalledTimes(3)
  })

  it('does not poll while disabled, and stops when disabled', async () => {
    const { poll, hook } = setup({ isEnabled: false })
    await advance(MINUTE)
    expect(poll).not.toHaveBeenCalled()

    hook.rerender({ isEnabled: true })
    await advance(0)
    expect(poll).toHaveBeenCalledTimes(1)

    hook.rerender({ isEnabled: false })
    await advance(5 * MINUTE)
    expect(poll).toHaveBeenCalledTimes(1)
  })

  it('backs off to 20s, 40s, then 60s while polls find no new rows', async () => {
    const { poll } = setup({ result: NO_ROWS })
    await advance(0) // poll 1 at 0s
    await advance(20 * SECOND) // poll 2 at 20s
    expect(poll).toHaveBeenCalledTimes(2)
    await advance(39 * SECOND)
    expect(poll).toHaveBeenCalledTimes(2)
    await advance(1 * SECOND) // poll 3 at 60s
    expect(poll).toHaveBeenCalledTimes(3)
    await advance(60 * SECOND) // poll 4 at 120s
    await advance(60 * SECOND) // poll 5 at 180s (capped)
    expect(poll).toHaveBeenCalledTimes(5)
  })

  it('returns to the base interval once a poll finds rows again', async () => {
    const { poll } = setup({ result: NO_ROWS })
    await advance(0)
    await advance(20 * SECOND) // second empty poll; next delay 40s
    poll.mockResolvedValue(NEW_ROWS)
    await advance(40 * SECOND) // this poll finds rows
    expect(poll).toHaveBeenCalledTimes(3)
    await advance(10 * SECOND)
    expect(poll).toHaveBeenCalledTimes(4)
  })

  it('resets the backoff when the user interacts with the page', async () => {
    const { poll } = setup({ result: NO_ROWS })
    await advance(0)
    await advance(20 * SECOND)
    await advance(40 * SECOND) // three empty polls; next delay 60s
    expect(poll).toHaveBeenCalledTimes(3)

    await interact()
    await advance(10 * SECOND)
    expect(poll).toHaveBeenCalledTimes(4)
  })

  it('stops polling while the tab is hidden and polls immediately when it is visible again', async () => {
    const { poll } = setup()
    await advance(0)
    expect(poll).toHaveBeenCalledTimes(1)

    await setVisibility('hidden')
    await advance(5 * MINUTE)
    expect(poll).toHaveBeenCalledTimes(1)

    await setVisibility('visible')
    await advance(0)
    expect(poll).toHaveBeenCalledTimes(2)
    await advance(10 * SECOND)
    expect(poll).toHaveBeenCalledTimes(3)
  })

  it('does not start polling when enabled in a hidden tab', async () => {
    visibilityState = 'hidden'
    const { poll } = setup()
    await advance(MINUTE)
    expect(poll).not.toHaveBeenCalled()
  })

  it('calls onIdle after 15 minutes without activity', async () => {
    const { onIdle } = setup()
    await advance(LIVE_MODE_IDLE_TIMEOUT_MS - SECOND)
    expect(onIdle).not.toHaveBeenCalled()
    await advance(SECOND)
    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('restarts the idle timeout on user activity', async () => {
    const { onIdle } = setup()
    await advance(10 * MINUTE)
    await interact()
    await advance(14 * MINUTE)
    expect(onIdle).not.toHaveBeenCalled()
    await advance(MINUTE)
    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('does not count hidden time toward the idle timeout', async () => {
    const { onIdle } = setup()
    await advance(10 * MINUTE)
    await setVisibility('hidden')
    await advance(30 * MINUTE)
    expect(onIdle).not.toHaveBeenCalled()

    await setVisibility('visible')
    await advance(LIVE_MODE_IDLE_TIMEOUT_MS - SECOND)
    expect(onIdle).not.toHaveBeenCalled()
    await advance(SECOND)
    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('keeps polling after a failed poll', async () => {
    const { poll } = setup()
    poll.mockRejectedValueOnce(new Error('network'))
    await advance(0)
    await advance(10 * SECOND)
    expect(poll).toHaveBeenCalledTimes(2)
  })
})
