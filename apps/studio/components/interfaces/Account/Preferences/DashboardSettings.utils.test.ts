import { describe, expect, it, vi } from 'vitest'

const mockIsPlatform = vi.hoisted(() => ({ value: true }))

vi.mock('lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('lib/constants')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
  }
})

import { getDashboardSettingsUrl } from './DashboardSettings.utils'

describe('getDashboardSettingsUrl', () => {
  it('returns account page URL on platform', () => {
    mockIsPlatform.value = true
    expect(getDashboardSettingsUrl('my-ref')).toBe('/account/me#dashboard')
  })

  it('returns project settings URL on self-hosted', () => {
    mockIsPlatform.value = false
    expect(getDashboardSettingsUrl('my-ref')).toBe(
      '/project/my-ref/settings/preferences#dashboard'
    )
  })
})
