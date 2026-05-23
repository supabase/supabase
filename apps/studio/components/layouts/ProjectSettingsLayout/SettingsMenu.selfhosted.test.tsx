import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useGenerateSettingsMenu } from './SettingsMenu.utils'

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    IS_PLATFORM: false,
  }
})

vi.mock('common', () => ({
  useFlag: vi.fn().mockReturnValue(false),
  useParams: vi.fn().mockReturnValue({ ref: 'project-ref' }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: vi.fn().mockReturnValue({ data: { slug: 'my-org' } }),
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: vi.fn().mockReturnValue({ data: { status: 'ACTIVE_HEALTHY' } }),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: vi
    .fn()
    .mockReturnValue({ projectSettingsLegacyJwtKeys: false, billingAll: true }),
}))

vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useIsPlatformWebhooksEnabled: vi.fn().mockReturnValue(false),
}))

describe('useGenerateSettingsMenu (self-hosted)', () => {
  it('includes General, API Keys, JWT Keys, and Log Drains in self-hosted mode', () => {
    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configGroup = result.current.find((group) => group.title === 'Configuration')

    expect(configGroup?.items.some((item) => item.key === 'general')).toBe(true)
    expect(configGroup?.items.some((item) => item.key === 'api-keys')).toBe(true)
    expect(configGroup?.items.some((item) => item.key === 'jwt')).toBe(true)
    expect(configGroup?.items.some((item) => item.key === 'log-drains')).toBe(true)
  })

  it('includes Data API and Vault integrations in self-hosted mode', () => {
    const { result } = renderHook(() => useGenerateSettingsMenu())
    const integrationsGroup = result.current.find((group) => group.title === 'Integrations')

    expect(integrationsGroup?.items.some((item) => item.key === 'api')).toBe(true)
    expect(integrationsGroup?.items.some((item) => item.key === 'vault')).toBe(true)
  })

  it('does not include dashboard settings in self-hosted mode', () => {
    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configGroup = result.current.find((group) => group.title === 'Configuration')

    expect(configGroup?.items.some((item) => item.key === 'dashboard')).toBe(false)
  })

  it('does not include platform-only settings in self-hosted mode', () => {
    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configGroup = result.current.find((group) => group.title === 'Configuration')

    expect(configGroup?.items.some((item) => item.key === 'compute-and-disk')).toBe(false)
    expect(configGroup?.items.some((item) => item.key === 'infrastructure')).toBe(false)
    expect(configGroup?.items.some((item) => item.key === 'addons')).toBe(false)
  })

  it('does not include billing group in self-hosted mode', () => {
    const { result } = renderHook(() => useGenerateSettingsMenu())
    expect(result.current.some((group) => group.title === 'Billing')).toBe(false)
  })
})
