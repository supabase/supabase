// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useConnectServerEnv } from '../useConnectServerEnv'
import { useRevealedSecret } from '@/components/interfaces/APIKeys/useRevealedSecret'
import { getAPIKeysById } from '@/data/api-keys/api-key-id-query'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

vi.mock('@/hooks/misc/useCheckPermissionsV2', () => ({
  useAsyncCheckPermissionsV2: vi.fn(),
  FGA_PERMISSIONS: {
    PROJECT: {},
  },
}))
vi.mock('@/data/config/project-endpoint-query', () => ({
  useProjectApiUrl: vi.fn(),
}))
vi.mock('@/data/api-keys/api-keys-query', () => ({
  useAPIKeys: vi.fn(),
}))
vi.mock('@/data/api-keys/api-key-id-query', () => ({
  getAPIKeysById: vi.fn(),
}))
vi.mock('@/components/interfaces/APIKeys/useRevealedSecret', () => ({
  useRevealedSecret: vi.fn(),
}))

const SECRET_KEY = { id: 'secret-id', api_key: 'sb_secret_abcdefghijklmnopqrstuv' }
const SECRET_FULL = 'sb_secret_abcdefghijklmnopqrstuv_full'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.mocked(useAsyncCheckPermissionsV2).mockReturnValue({
    can: true,
    isLoading: false,
  } as any)
  vi.mocked(useProjectApiUrl).mockReturnValue({
    data: 'https://test.supabase.co',
    isPending: false,
  } as any)
  vi.mocked(useAPIKeys).mockReturnValue({
    data: { secretKey: SECRET_KEY, publishableKey: { api_key: 'sb_publishable_x' } },
    isLoading: false,
  } as any)
})

describe('useConnectServerEnv secret reveal', () => {
  const clearMock = vi.fn()
  let revealMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clearMock.mockClear()
    revealMock = vi.fn()
    vi.mocked(useRevealedSecret).mockReturnValue({
      data: undefined,
      isLoading: false,
      reveal: revealMock,
      clear: clearMock,
    } as any)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shares one in-flight reveal request between a concurrent toggle() and getValue()', async () => {
    const { promise, resolve } = deferred<string>()
    revealMock.mockReturnValue(promise)

    const { result } = renderHook(() => useConnectServerEnv())

    // A caller invokes getValue() first (e.g. "Copy secret") while isRevealed
    // is still false...
    let getValuePromise!: Promise<string>
    act(() => {
      getValuePromise = result.current.secret.getValue()
    })

    // ...then, before that reveal resolves, the user clicks "Reveal".
    let togglePromise!: Promise<void>
    act(() => {
      togglePromise = result.current.secret.toggle()
    })

    // Only one underlying request should have been made.
    expect(revealMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolve(SECRET_FULL)
      await Promise.all([getValuePromise, togglePromise])
    })

    expect(await getValuePromise).toBe(SECRET_FULL)
    // getValue()'s closure was created while isRevealed was still false, but
    // toggle() flipped it true before the reveal resolved. It must check the
    // live state, not hide the secret the user just explicitly revealed.
    expect(clearMock).not.toHaveBeenCalled()
    expect(result.current.secret.isRevealed).toBe(true)
  })

  it('hides the secret again after a bare getValue() peek (no concurrent toggle)', async () => {
    const { promise, resolve } = deferred<string>()
    revealMock.mockReturnValue(promise)

    const { result } = renderHook(() => useConnectServerEnv())

    let getValuePromise!: Promise<string>
    act(() => {
      getValuePromise = result.current.secret.getValue()
    })

    await act(async () => {
      resolve(SECRET_FULL)
      await getValuePromise
    })

    expect(await getValuePromise).toBe(SECRET_FULL)
    expect(clearMock).toHaveBeenCalledTimes(1)
  })

  it('rejects toggle() with the original error attached as `cause`, and resets isRevealed', async () => {
    const originalError = new Error('network down')
    revealMock.mockRejectedValue(originalError)

    const { result } = renderHook(() => useConnectServerEnv())

    await expect(
      act(async () => {
        await result.current.secret.toggle()
      })
    ).rejects.toMatchObject({
      message: 'Failed to reveal secret API key',
      cause: originalError,
    })

    expect(result.current.secret.isRevealed).toBe(false)
  })

  it('auto-hides the secret after the reveal window elapses', async () => {
    vi.useFakeTimers()
    vi.mocked(useRevealedSecret).mockReturnValue({
      data: SECRET_FULL,
      isLoading: false,
      reveal: revealMock.mockResolvedValue(SECRET_FULL),
      clear: clearMock,
    } as any)

    const { result } = renderHook(() => useConnectServerEnv())

    await act(async () => {
      await result.current.secret.toggle()
    })
    expect(result.current.secret.isRevealed).toBe(true)

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(result.current.secret.isRevealed).toBe(false)
    expect(clearMock).toHaveBeenCalledTimes(1)
  })
})

// Uses the real useRevealedSecret so the requestId invalidation in clear() actually interacts
// with revealPromiseRef in useConnectServerEnv.
describe('useConnectServerEnv secret reveal (real useRevealedSecret)', () => {
  beforeEach(async () => {
    const actual = await vi.importActual<
      typeof import('@/components/interfaces/APIKeys/useRevealedSecret')
    >('@/components/interfaces/APIKeys/useRevealedSecret')
    vi.mocked(useRevealedSecret).mockImplementation(actual.useRevealedSecret)
  })

  it('fires a fresh request on reveal after a hide interrupts an in-flight reveal, instead of reusing the invalidated promise', async () => {
    const first = deferred<{ api_key: string }>()
    const second = deferred<{ api_key: string }>()
    vi.mocked(getAPIKeysById).mockReturnValueOnce(first.promise as any)
    vi.mocked(getAPIKeysById).mockReturnValueOnce(second.promise as any)

    const { result } = renderHook(() => useConnectServerEnv())

    // Reveal is clicked, kicking off the first (never-resolving-yet) request.
    let togglePromise1!: Promise<void>
    act(() => {
      togglePromise1 = result.current.secret.toggle()
    })
    expect(result.current.secret.isRevealed).toBe(true)

    // Hide is clicked before that request settles.
    act(() => {
      result.current.secret.toggle()
    })
    expect(result.current.secret.isRevealed).toBe(false)

    // Reveal is clicked again, still before the first request settles.
    let togglePromise2!: Promise<void>
    act(() => {
      togglePromise2 = result.current.secret.toggle()
    })
    expect(result.current.secret.isRevealed).toBe(true)

    // A brand new request must have been issued rather than reusing the
    // (now-invalidated) first one.
    expect(getAPIKeysById).toHaveBeenCalledTimes(2)

    // The stale first request finally resolves; it must be ignored.
    await act(async () => {
      first.resolve({ api_key: SECRET_FULL + '_stale' })
      await togglePromise1
    })

    // The second (live) request resolves with the real value.
    await act(async () => {
      second.resolve({ api_key: SECRET_FULL })
      await togglePromise2
    })

    expect(result.current.secret.isRevealed).toBe(true)
    expect(result.current.secret.isRevealing).toBe(false)
    expect(result.current.secret.displayValue).toBe(SECRET_FULL)
  })
})
