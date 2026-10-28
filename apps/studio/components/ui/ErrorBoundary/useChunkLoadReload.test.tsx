import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { useChunkLoadReload } from './useChunkLoadReload'
import { CHUNK_LOAD_RELOAD_STORAGE_KEY } from '@/lib/chunk-load-error'

const reload = vi.fn()

function chunkError() {
  return new TypeError('Importing a module script failed.')
}

describe('useChunkLoadReload', () => {
  const originalLocation = window.location

  beforeEach(() => {
    window.sessionStorage.clear()
    reload.mockClear()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    vi.restoreAllMocks()
  })

  test('claims the guard and reloads after commit for a chunk error', () => {
    const error = chunkError()
    const { result } = renderHook(() => useChunkLoadReload(error))

    expect(result.current.isReloading).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(window.sessionStorage.getItem(CHUNK_LOAD_RELOAD_STORAGE_KEY)).not.toBeNull()
  })

  test('does nothing for a non-chunk error', () => {
    const error = new Error('boom')
    const { result } = renderHook(() => useChunkLoadReload(error))

    expect(result.current.isReloading).toBe(false)
    expect(reload).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem(CHUNK_LOAD_RELOAD_STORAGE_KEY)).toBeNull()
  })

  test('shows the error state when a reload already happened within the window', () => {
    const first = chunkError()
    renderHook(() => useChunkLoadReload(first))
    reload.mockClear()

    const second = chunkError()
    const { result } = renderHook(() => useChunkLoadReload(second))

    expect(result.current.isReloading).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })

  test('falls back to the error state when the claim is refused after render', () => {
    // Peek reads fine, but the guard write never sticks
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})

    const error = chunkError()
    const { result } = renderHook(() => useChunkLoadReload(error))

    expect(result.current.isReloading).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })
})
