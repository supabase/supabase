import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDefaultProvider } from './infrastructure'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'

vi.mock('hooks/custom-content/useCustomContent', () => ({
  useCustomContent: vi.fn(),
}))

describe('useDefaultProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should return AWS_K8S for staging environment', () => {
    vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'staging')
    ;(useCustomContent as any).mockReturnValue({
      infraCloudProviders: ['AWS_K8S', 'AWS'],
    })

    const { result } = renderHook(() => useDefaultProvider())

    expect(result.current).toBe('AWS_K8S')
  })

  it('should return AWS_K8S for preview environment', () => {
    vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'preview')
    ;(useCustomContent as any).mockReturnValue({
      infraCloudProviders: ['AWS_K8S', 'AWS'],
    })

    const { result } = renderHook(() => useDefaultProvider())

    expect(result.current).toBe('AWS_K8S')
  })

  it('should return AWS for other environments', () => {
    vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'production')
    ;(useCustomContent as any).mockReturnValue({
      infraCloudProviders: ['AWS', 'FLY'],
    })

    const { result } = renderHook(() => useDefaultProvider())

    expect(result.current).toBe('AWS')
  })

  it.skip('should return first valid provider when default is not in list', () => {
    // Explicitly set environment to non-staging/preview value
    vi.unstubAllEnvs()
    vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'other')

    // Reset and set mock
    vi.mocked(useCustomContent).mockReset()
    vi.mocked(useCustomContent).mockReturnValue({
      infraCloudProviders: ['FLY'],
    })

    const { result } = renderHook(() => useDefaultProvider())

    expect(result.current).toBe('FLY')
  })

  it('should return AWS as fallback when no valid providers', () => {
    vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'production')
    ;(useCustomContent as any).mockReturnValue({
      infraCloudProviders: [],
    })

    const { result } = renderHook(() => useDefaultProvider())

    expect(result.current).toBe('AWS')
  })

  it('should return AWS as fallback when infraCloudProviders is undefined', () => {
    vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'production')
    ;(useCustomContent as any).mockReturnValue({
      infraCloudProviders: undefined,
    })

    const { result } = renderHook(() => useDefaultProvider())

    expect(result.current).toBe('AWS')
  })

  it('should export constants', async () => {
    const constants = await import('./infrastructure')

    expect(constants.MANAGED_BY).toHaveProperty('VERCEL_MARKETPLACE')
    expect(constants.MANAGED_BY).toHaveProperty('AWS_MARKETPLACE')
    expect(constants.MANAGED_BY).toHaveProperty('SUPABASE')
    expect(constants.PROVIDERS).toHaveProperty('FLY')
    expect(constants.PROVIDERS).toHaveProperty('AWS')
    expect(constants.PROJECT_STATUS).toHaveProperty('ACTIVE_HEALTHY')
    expect(constants.DEFAULT_MINIMUM_PASSWORD_STRENGTH).toBe(4)
    expect(constants.PASSWORD_STRENGTH).toHaveProperty(0)
    expect(constants.PASSWORD_STRENGTH).toHaveProperty(4)
  })
})

