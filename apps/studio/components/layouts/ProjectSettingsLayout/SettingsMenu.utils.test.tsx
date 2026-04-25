import { renderHook } from '@testing-library/react'
import { useFlag } from 'common'
import { describe, expect, it, vi } from 'vitest'

import { useGenerateSettingsMenu } from './SettingsMenu.utils'
import { useIsPlatformWebhooksEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    IS_PLATFORM: true,
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
  useIsPlatformWebhooksEnabled: vi.fn().mockReturnValue(true),
}))

describe('useGenerateSettingsMenu', () => {
  it('includes webhooks when platformWebhooks feature is enabled', () => {
    vi.mocked(useIsPlatformWebhooksEnabled).mockReturnValue(true)

    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configurationGroup = result.current.find((group) => group.title === 'Configuration')
    const hasWebhooks = configurationGroup?.items.some(
      (item) => item.name === 'Webhooks' && item.url === '/project/project-ref/settings/webhooks'
    )

    expect(hasWebhooks).toBe(true)
  })

  it('hides webhooks when platformWebhooks feature is disabled', () => {
    vi.mocked(useIsPlatformWebhooksEnabled).mockReturnValue(false)

    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configurationGroup = result.current.find((group) => group.title === 'Configuration')
    const hasWebhooks = configurationGroup?.items.some((item) => item.name === 'Webhooks')

    expect(hasWebhooks).toBe(false)
  })

  it('does not include members link in project settings navigation', () => {
    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configurationGroup = result.current.find((group) => group.title === 'Configuration')
    const hasMembers = configurationGroup?.items.some((item) => item.name === 'Members')

    expect(hasMembers).toBe(false)
  })

  it('includes dashboard in configuration when flag is enabled', () => {
    vi.mocked(useFlag).mockReturnValue(true)

    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configurationGroup = result.current.find((group) => group.title === 'Configuration')
    const hasDashboardPreferences = configurationGroup?.items.some(
      (item) => item.name === 'Dashboard' && item.url === '/project/project-ref/settings/dashboard'
    )

    expect(hasDashboardPreferences).toBe(true)
    expect(result.current.find((group) => group.title === 'Preferences')).toBeUndefined()
  })

  it('hides dashboard in configuration when flag is disabled', () => {
    vi.mocked(useFlag).mockReturnValue(false)

    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configurationGroup = result.current.find((group) => group.title === 'Configuration')

    expect(configurationGroup?.items.some((item) => item.name === 'Dashboard')).toBe(false)
  })
})
