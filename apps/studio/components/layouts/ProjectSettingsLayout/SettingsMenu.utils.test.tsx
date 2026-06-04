import { renderHook } from '@testing-library/react'
import { useFlag } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGenerateSettingsMenu } from './SettingsMenu.utils'
import { useIsPlatformWebhooksEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const getShortcutId = (item: unknown) => (item as { shortcutId?: string } | undefined)?.shortcutId

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
  useIsFeatureEnabled: vi.fn(),
}))

vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useIsPlatformWebhooksEnabled: vi.fn().mockReturnValue(true),
}))

describe('useGenerateSettingsMenu', () => {
  beforeEach(() => {
    vi.mocked(useFlag).mockReturnValue(false)
    vi.mocked(useIsPlatformWebhooksEnabled).mockReturnValue(true)
    vi.mocked(useIsFeatureEnabled).mockReturnValue({
      projectSettingsLegacyJwtKeys: false,
      billingAll: true,
      logsAll: true,
      projectSettingsLogDrains: true,
    } as any)
  })

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

  it('includes log drains when logs:all and project_settings:log_drains are enabled', () => {
    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configurationGroup = result.current.find((group) => group.title === 'Configuration')

    expect(configurationGroup?.items.some((item) => item.key === 'log-drains')).toBe(true)
  })

  it('hides log drains when logs:all is disabled', () => {
    vi.mocked(useIsFeatureEnabled).mockReturnValue({
      projectSettingsLegacyJwtKeys: false,
      billingAll: true,
      logsAll: false,
      projectSettingsLogDrains: true,
    } as any)

    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configurationGroup = result.current.find((group) => group.title === 'Configuration')

    expect(configurationGroup?.items.some((item) => item.key === 'log-drains')).toBe(false)
  })

  it('hides log drains when project_settings:log_drains is disabled', () => {
    vi.mocked(useIsFeatureEnabled).mockReturnValue({
      projectSettingsLegacyJwtKeys: false,
      billingAll: true,
      logsAll: true,
      projectSettingsLogDrains: false,
    } as any)

    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configurationGroup = result.current.find((group) => group.title === 'Configuration')

    expect(configurationGroup?.items.some((item) => item.key === 'log-drains')).toBe(false)
  })

  it('adds shortcuts to eligible configuration settings items', () => {
    vi.mocked(useFlag).mockReturnValue(true)

    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configurationGroup = result.current.find((group) => group.title === 'Configuration')
    const shortcutByKey = new Map(
      configurationGroup?.items.map((item) => [item.key, getShortcutId(item)]) ?? []
    )

    expect(shortcutByKey.get('general')).toBe(SHORTCUT_IDS.NAV_PROJECT_SETTINGS_GENERAL)
    expect(shortcutByKey.get('compute-and-disk')).toBe(
      SHORTCUT_IDS.NAV_PROJECT_SETTINGS_COMPUTE_AND_DISK
    )
    expect(shortcutByKey.get('infrastructure')).toBe(
      SHORTCUT_IDS.NAV_PROJECT_SETTINGS_INFRASTRUCTURE
    )
    expect(shortcutByKey.get('integrations')).toBe(SHORTCUT_IDS.NAV_PROJECT_SETTINGS_INTEGRATIONS)
    expect(shortcutByKey.get('webhooks')).toBe(SHORTCUT_IDS.NAV_PROJECT_SETTINGS_WEBHOOKS)
    expect(shortcutByKey.get('api-keys')).toBe(SHORTCUT_IDS.NAV_PROJECT_SETTINGS_API_KEYS)
    expect(shortcutByKey.get('jwt')).toBe(SHORTCUT_IDS.NAV_PROJECT_SETTINGS_JWT_KEYS)
    expect(shortcutByKey.get('log-drains')).toBe(SHORTCUT_IDS.NAV_PROJECT_SETTINGS_LOG_DRAINS)
    expect(shortcutByKey.get('addons')).toBe(SHORTCUT_IDS.NAV_PROJECT_SETTINGS_ADDONS)
    expect(shortcutByKey.get('dashboard')).toBe(SHORTCUT_IDS.NAV_PROJECT_SETTINGS_DASHBOARD)
  })

  it('does not add settings shortcuts to external integration or billing items', () => {
    const { result } = renderHook(() => useGenerateSettingsMenu())
    const integrationGroup = result.current.find((group) => group.title === 'Integrations')
    const billingGroup = result.current.find((group) => group.title === 'Billing')

    expect(
      getShortcutId(integrationGroup?.items.find((item) => item.key === 'api'))
    ).toBeUndefined()
    expect(
      getShortcutId(integrationGroup?.items.find((item) => item.key === 'vault'))
    ).toBeUndefined()
    expect(
      getShortcutId(billingGroup?.items.find((item) => item.key === 'subscription'))
    ).toBeUndefined()
    expect(getShortcutId(billingGroup?.items.find((item) => item.key === 'usage'))).toBeUndefined()
  })
})
