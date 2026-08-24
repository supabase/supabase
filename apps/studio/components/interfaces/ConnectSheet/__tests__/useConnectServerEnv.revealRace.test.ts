import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useConnectServerEnv } from '../useConnectServerEnv'
import { getAPIKeysById } from '@/data/api-keys/api-key-id-query'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

// Uses the real useRevealedSecret (not mocked) so the requestId invalidation
// in clear() actually interacts with revealPromiseRef in useConnectServerEnv.
vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: vi.fn(),
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

const SECRET_KEY = { id: 'secret-id', api_key: 'sb_secret_abcdefghijklmnopqrstuv' }
const SECRET_FULL = 'sb_secret_abcdefghijklmnopqrstuv_full'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('useConnectServerEnv secret reveal (real useRevealedSecret)', () => {
  beforeEach(() => {
    vi.mocked(useAsyncCheckPermissions).mockReturnValue({
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
