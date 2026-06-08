import { describe, expect, it } from 'vitest'

import {
  getOrgActiveRoute,
  getOrgSectionKeyFromPathname,
  isOrgMenuActive,
  type OrgNavItem,
} from './OrgMenuContent.utils'

const mockItem = (key: string): OrgNavItem => ({
  key,
  label: key,
  href: `/org/foo/${key}`,
  icon: null,
})

describe('getOrgActiveRoute', () => {
  it('returns segment after org slug', () => {
    expect(getOrgActiveRoute('/org/my-org/team')).toBe('team')
    expect(getOrgActiveRoute('/org/my-org/integrations')).toBe('integrations')
    expect(getOrgActiveRoute('/org/my-org/settings/general')).toBe('settings')
  })

  it('returns undefined for org home', () => {
    expect(getOrgActiveRoute('/org/my-org')).toBeUndefined()
    expect(getOrgActiveRoute('/org/my-org/')).toBeUndefined()
  })

  it('returns undefined when path too short', () => {
    expect(getOrgActiveRoute('/org')).toBeUndefined()
    expect(getOrgActiveRoute('/')).toBeUndefined()
    expect(getOrgActiveRoute('')).toBeUndefined()
  })

  it('returns undefined when org segment not found', () => {
    expect(getOrgActiveRoute('/project/ref/database')).toBeUndefined()
  })
})

describe('isOrgMenuActive', () => {
  it('first item (index 0) is active when activeRoute is undefined', () => {
    expect(isOrgMenuActive(mockItem('projects'), 0, '/org/foo', undefined)).toBe(true)
  })

  it('first item is not active when activeRoute is defined', () => {
    expect(isOrgMenuActive(mockItem('projects'), 0, '/org/foo/team', 'team')).toBe(false)
  })

  it('item is active when activeRoute matches item key', () => {
    expect(isOrgMenuActive(mockItem('team'), 1, '/org/foo/team', 'team')).toBe(true)
    expect(
      isOrgMenuActive(mockItem('integrations'), 2, '/org/foo/integrations', 'integrations')
    ).toBe(true)
  })

  it('settings item is active when pathname includes settings sub-routes', () => {
    expect(isOrgMenuActive(mockItem('settings'), 5, '/org/foo/settings/general', 'settings')).toBe(
      true
    )
    expect(isOrgMenuActive(mockItem('settings'), 5, '/org/foo/general', undefined)).toBe(true)
    expect(isOrgMenuActive(mockItem('settings'), 5, '/org/foo/apps', undefined)).toBe(true)
    expect(isOrgMenuActive(mockItem('settings'), 5, '/org/foo/audit', undefined)).toBe(true)
    expect(isOrgMenuActive(mockItem('settings'), 5, '/org/foo/documents', undefined)).toBe(true)
    expect(isOrgMenuActive(mockItem('settings'), 5, '/org/foo/security', undefined)).toBe(true)
    expect(isOrgMenuActive(mockItem('settings'), 5, '/org/foo/sso', undefined)).toBe(true)
  })

  it('settings item is not active when pathname has no settings sub-route', () => {
    expect(isOrgMenuActive(mockItem('settings'), 5, '/org/foo/team', 'team')).toBe(false)
  })

  it('item is not active when activeRoute does not match', () => {
    expect(isOrgMenuActive(mockItem('team'), 1, '/org/foo/team', 'usage')).toBe(false)
  })
})

describe('getOrgSectionKeyFromPathname', () => {
  it('returns settings for org settings sub-routes', () => {
    expect(getOrgSectionKeyFromPathname('general')).toBe('settings')
    expect(getOrgSectionKeyFromPathname('security')).toBe('settings')
    expect(getOrgSectionKeyFromPathname('sso')).toBe('settings')
    expect(getOrgSectionKeyFromPathname('apps')).toBe('settings')
    expect(getOrgSectionKeyFromPathname('audit')).toBe('settings')
    expect(getOrgSectionKeyFromPathname('documents')).toBe('settings')
  })

  it('returns null for non-settings routes', () => {
    expect(getOrgSectionKeyFromPathname('team')).toBeNull()
    expect(getOrgSectionKeyFromPathname('integrations')).toBeNull()
    expect(getOrgSectionKeyFromPathname('billing')).toBeNull()
    expect(getOrgSectionKeyFromPathname('usage')).toBeNull()
  })

  it('returns null when activeRoute is undefined', () => {
    expect(getOrgSectionKeyFromPathname(undefined)).toBeNull()
  })
})
