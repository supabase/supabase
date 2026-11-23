import { renderHook } from '@testing-library/react'
import { useFlag } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGenerateSettingsMenu } from './SettingsMenu.utils'
import { useIsPlatformWebhooksEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

const getShortcutId = (item: unknown) => (item as { shortcutId?: string } | undefined)?.shortcutId

const { mockIsPlatform } = vi.hoisted(() => ({ mockIsPlatform: { value: true } }))

vi.mock('@/lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/constants')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
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

const FEATURES = {
  projectSettingsLegacyJwtKeys: false,
  billingAll: true,
  logsAll: true,
  projectSettingsLogDrains: true,
}

const getConfigurationKeys = () => {
  const { result } = renderHook(() => useGenerateSettingsMenu())
  return result.current
    .find((group) => group.title === 'Configuration')
    ?.items.map((item) => item.key)
}

beforeEach(() => {
  mockIsPlatform.value = true
})

describe.each([
  ['platform', true],
  ['self-hosted', false],
])('useGenerateSettingsMenu log drains (%s)', (_, isPlatform) => {
  beforeEach(() => {
    mockIsPlatform.value = isPlatform
  })

  it.each([
    [{}, true],
    [{ logsAll: false }, false],
    [{ projectSettingsLogDrains: false }, false],
  ])('with feature overrides %o shows log drains: %s', (overrides, expected) => {
    vi.mocked(useIsFeatureEnabled).mockReturnValue({ ...FEATURES, ...overrides } as any)
    expect(getConfigurationKeys()?.includes('log-drains')).toBe(expected)
  })
})

describe('useGenerateSettingsMenu (self-hosted)', () => {
  beforeEach(() => {
    mockIsPlatform.value = false
    vi.mocked(useIsPlatformWebhooksEnabled).mockReturnValue(false)
    vi.mocked(useIsFeatureEnabled).mockReturnValue(FEATURES as any)
  })

  it('includes only the self-hosted configuration items and integrations, with no billing group', () => {
    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configGroup = result.current.find((group) => group.title === 'Configuration')
    const configKeys = configGroup?.items.map((item) => item.key)
    const integrationKeys = result.current
      .find((group) => group.title === 'Integrations')
      ?.items.map((item) => item.key)

    expect(configKeys).toEqual(expect.arrayContaining(['general', 'api-keys', 'jwt', 'log-drains']))
    expect(configKeys).not.toContain('dashboard')
    expect(configKeys).not.toContain('infrastructure')
    expect(configKeys).not.toContain('addons')
    expect(getShortcutId(configGroup?.items.find((item) => item.key === 'log-drains'))).toBe(
      SHORTCUT_IDS.NAV_PROJECT_SETTINGS_LOG_DRAINS
    )
    expect(integrationKeys).toEqual(expect.arrayContaining(['api', 'vault']))
    expect(result.current.some((group) => group.title === 'Billing')).toBe(false)
  })
})

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

  it('uses Infrastructure as the canonical compute and disk destination', () => {
    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configurationGroup = result.current.find((group) => group.title === 'Configuration')

    expect(configurationGroup?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'infrastructure',
          name: 'Infrastructure',
          url: '/project/project-ref/settings/infrastructure',
        }),
      ])
    )
    expect(
      configurationGroup?.items.some(
        (item) => item.key === 'compute-and-disk' || item.name === 'Compute and Disk'
      )
    ).toBe(false)
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

  it('adds shortcuts to eligible configuration settings items', () => {
    vi.mocked(useFlag).mockReturnValue(true)

    const { result } = renderHook(() => useGenerateSettingsMenu())
    const configurationGroup = result.current.find((group) => group.title === 'Configuration')
    const shortcutByKey = new Map(
      configurationGroup?.items.map((item) => [item.key, getShortcutId(item)]) ?? []
    )

    expect(shortcutByKey.get('general')).toBe(SHORTCUT_IDS.NAV_PROJECT_SETTINGS_GENERAL)
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
