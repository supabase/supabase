import { describe, expect, it } from 'vitest'

import { getDashboardSettingsUrl } from './DashboardSettings.utils'

describe('getDashboardSettingsUrl', () => {
  it('returns the shared account preferences URL', () => {
    expect(getDashboardSettingsUrl()).toBe('/account/me#dashboard')
  })
})
