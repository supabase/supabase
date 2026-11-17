import { describe, expect, it, vi } from 'vitest'

import footerData from './Footer'

vi.mock('data/Solutions', () => ({
  appTypeSolutions: { solutions: [] },
  migrationSolutions: { solutions: [] },
  skillBasedSolutions: { solutions: [] },
  useCaseSolutions: { solutions: [] },
}))
vi.mock('ui-patterns/PrivacySettings', () => ({
  PrivacySettings: function PrivacySettings() {},
  PrivacySettingsLabel: function PrivacySettingsLabel() {},
}))

describe('footer data', () => {
  it('labels the Privacy Settings link by visitor country', async () => {
    const { PrivacySettings, PrivacySettingsLabel } = await import('ui-patterns/PrivacySettings')
    const link = footerData
      .flatMap((segment) => segment.links)
      .find((l) => l.component === PrivacySettings)
    expect(link?.text).toMatchObject({ type: PrivacySettingsLabel })
  })
})
