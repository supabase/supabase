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

describe('NAV_ORG_SETTINGS remap', () => {
  it('uses G , (matching project settings chord)', () => {
    const def = SHORTCUT_DEFINITIONS[SHORTCUT_IDS.NAV_ORG_SETTINGS]
    expect(def.sequence).toEqual(['G', ','])
  })
})

describe('Org action shortcuts', () => {
  it('ORG_OAUTH_APPS_PUBLISH is registered', () => {
    expect(SHORTCUT_DEFINITIONS[SHORTCUT_IDS.ORG_OAUTH_APPS_PUBLISH]).toBeDefined()
    expect(SHORTCUT_DEFINITIONS[SHORTCUT_IDS.ORG_OAUTH_APPS_PUBLISH].sequence).toEqual(['Shift+N'])
  })

  it('ORG_OAUTH_APPS_SUBMIT uses Mod+Enter and is hidden from settings', () => {
    const def = SHORTCUT_DEFINITIONS[SHORTCUT_IDS.ORG_OAUTH_APPS_SUBMIT]
    expect(def.sequence).toEqual(['Mod+Enter'])
    expect(def.showInSettings).toBe(false)
  })

  it('ORG_TEAM_INVITE is registered', () => {
    expect(SHORTCUT_DEFINITIONS[SHORTCUT_IDS.ORG_TEAM_INVITE].sequence).toEqual(['Shift+N'])
  })

  it('ORG_TEAM_INVITE_SUBMIT uses Mod+Enter and is hidden from settings', () => {
    const def = SHORTCUT_DEFINITIONS[SHORTCUT_IDS.ORG_TEAM_INVITE_SUBMIT]
    expect(def.sequence).toEqual(['Mod+Enter'])
    expect(def.showInSettings).toBe(false)
  })

  it('ORG_INTEGRATIONS_ADD_CONNECTION is registered', () => {
    expect(SHORTCUT_DEFINITIONS[SHORTCUT_IDS.ORG_INTEGRATIONS_ADD_CONNECTION].sequence).toEqual([
      'Shift+N',
    ])
  })

  it('ORG_PROJECTS_NEW is registered', () => {
    expect(SHORTCUT_DEFINITIONS[SHORTCUT_IDS.ORG_PROJECTS_NEW].sequence).toEqual(['Shift+N'])
  })

  it('ORG_PROJECTS_SEARCH is registered', () => {
    expect(SHORTCUT_DEFINITIONS[SHORTCUT_IDS.ORG_PROJECTS_SEARCH].sequence).toEqual(['Shift+F'])
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
