import { renderHook } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSiwcQueryParamOptIn } from '../useSiwcQueryParamOptIn'

vi.mock('next/router', () => import('next-router-mock'))

// tests/vitestSetup.ts globally mocks `common`'s useParams to always return `{ ref: 'default' }`,
// which would make this hook's `siwcEnabled` lookup always undefined. Restore the real
// implementation here so useParams reflects the mocked router's query params.
vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual }
})

const mockSetValue = vi.hoisted(() => vi.fn())
const mockUseLocalStorageQuery = vi.hoisted(() => vi.fn())

vi.mock('../useLocalStorage', () => ({
  useLocalStorageQuery: mockUseLocalStorageQuery,
}))

describe('useSiwcQueryParamOptIn', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/sign-in')
    mockSetValue.mockClear()
    mockUseLocalStorageQuery.mockReturnValue([false, mockSetValue])
  })

  it('enables the flag when siwc-enabled=1 is present', () => {
    mockRouter.setCurrentUrl('/sign-in?siwc-enabled=1')

    renderHook(() => useSiwcQueryParamOptIn())

    expect(mockSetValue).toHaveBeenCalledWith(true)
  })

  it('does nothing when the param is absent', () => {
    renderHook(() => useSiwcQueryParamOptIn())

    expect(mockSetValue).not.toHaveBeenCalled()
  })

  it('does nothing for a non-"1" value', () => {
    mockRouter.setCurrentUrl('/sign-in?siwc-enabled=true')

    renderHook(() => useSiwcQueryParamOptIn())

    expect(mockSetValue).not.toHaveBeenCalled()
  })

  it('does nothing when siwc-enabled=0', () => {
    mockRouter.setCurrentUrl('/sign-in?siwc-enabled=0')

    renderHook(() => useSiwcQueryParamOptIn())

    expect(mockSetValue).not.toHaveBeenCalled()
  })

  it('only considers the first value when the param is repeated (array value)', () => {
    // useParams (from 'common') flattens repeated query params to their first occurrence, so
    // only the first "0" here is seen by the hook, and it does nothing.
    mockRouter.setCurrentUrl('/sign-in?siwc-enabled=0&siwc-enabled=1')

    renderHook(() => useSiwcQueryParamOptIn())

    expect(mockSetValue).not.toHaveBeenCalled()
  })

  it('still calls the setter when the flag is already true (idempotent no-op is the setter’s job)', () => {
    mockUseLocalStorageQuery.mockReturnValue([true, mockSetValue])
    mockRouter.setCurrentUrl('/sign-in?siwc-enabled=1')

    renderHook(() => useSiwcQueryParamOptIn())

    expect(mockSetValue).toHaveBeenCalledWith(true)
  })

  it('works the same way on the sign-up URL', () => {
    mockRouter.setCurrentUrl('/sign-up?siwc-enabled=1')

    renderHook(() => useSiwcQueryParamOptIn())

    expect(mockSetValue).toHaveBeenCalledWith(true)
  })
})
