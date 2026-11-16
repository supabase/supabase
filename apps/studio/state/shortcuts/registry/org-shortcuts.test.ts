import { describe, expect, it } from 'vitest'

import { SHORTCUT_REFERENCE_GROUP_ORDER, SHORTCUT_REFERENCE_GROUPS } from '../referenceGroups'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS } from '../registry'

describe('Org settings nav shortcuts', () => {
  const navIds = [
    SHORTCUT_IDS.NAV_ORG_SETTINGS_GENERAL,
    SHORTCUT_IDS.NAV_ORG_SETTINGS_SECURITY,
    SHORTCUT_IDS.NAV_ORG_SETTINGS_SSO,
    SHORTCUT_IDS.NAV_ORG_SETTINGS_APPS,
    SHORTCUT_IDS.NAV_ORG_SETTINGS_PRIVATE_APPS,
    SHORTCUT_IDS.NAV_ORG_SETTINGS_WEBHOOKS,
    SHORTCUT_IDS.NAV_ORG_SETTINGS_AUDIT,
    SHORTCUT_IDS.NAV_ORG_SETTINGS_AUDIT_LOG_DRAINS,
    SHORTCUT_IDS.NAV_ORG_SETTINGS_DOCUMENTS,
  ]

  it.each(navIds)('%s is registered with NAVIGATION_ORG_SETTINGS group', (id) => {
    expect(SHORTCUT_DEFINITIONS[id].referenceGroup).toBe(
      SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ORG_SETTINGS
    )
  })

  it.each(navIds)('%s sequence starts with S', (id) => {
    const sequence = SHORTCUT_DEFINITIONS[id].sequence
    expect(Array.isArray(sequence) ? sequence[0] : sequence).toBe('S')
  })
})

describe('Reference group ordering', () => {
  it('NAVIGATION_ORG_SETTINGS appears after NAVIGATION_GLOBAL', () => {
    const globalIdx = SHORTCUT_REFERENCE_GROUP_ORDER.indexOf(
      SHORTCUT_REFERENCE_GROUPS.NAVIGATION_GLOBAL
    )
    const orgSettingsIdx = SHORTCUT_REFERENCE_GROUP_ORDER.indexOf(
      SHORTCUT_REFERENCE_GROUPS.NAVIGATION_ORG_SETTINGS
    )
    expect(orgSettingsIdx).toBeGreaterThan(globalIdx)
  })
})
