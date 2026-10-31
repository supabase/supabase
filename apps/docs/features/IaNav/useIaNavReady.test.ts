// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useIaNavReady } from './useIaNavReady'

// the real module reads window.matchMedia on import, which jsdom does not have
vi.mock('common', () => ({}))

describe('useIaNavReady', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('is not ready on a first visit', () => {
    const { result } = renderHook(() => useIaNavReady())

    expect(result.current).toBe(false)
  })

  it('is ready when the last visit cached the variant', () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.IA_NAV_FLAG, 'option-1')

    const { result } = renderHook(() => useIaNavReady())

    expect(result.current).toBe(true)
  })
})
