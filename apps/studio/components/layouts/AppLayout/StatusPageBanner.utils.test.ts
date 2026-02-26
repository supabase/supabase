import { describe, expect, it } from 'vitest'

import { shouldShowBanner } from './StatusPageBanner.utils'

const noCache = { cache: null } as const
const noRestrictions = {
  cache: { affected_regions: null, affects_project_creation: false },
}
const affectsCreation = {
  cache: { affected_regions: null, affects_project_creation: true },
}
const usEast1Only = {
  cache: { affected_regions: ['us-east-1'], affects_project_creation: false },
}
const usEast1AndCreation = {
  cache: { affected_regions: ['us-east-1'], affects_project_creation: true },
}

describe('shouldShowBanner', () => {
  describe('no incidents', () => {
    it('does not show when there are no incidents', () => {
      expect(
        shouldShowBanner({ incidents: [], hasProjects: true, userRegions: new Set(['us-east-1']) })
      ).toBe(false)
    })
  })

  describe('user has no projects', () => {
    it('does not show when cache is absent', () => {
      expect(
        shouldShowBanner({ incidents: [noCache], hasProjects: false, userRegions: new Set() })
      ).toBe(false)
    })

    it('does not show when affects_project_creation is false', () => {
      expect(
        shouldShowBanner({
          incidents: [noRestrictions],
          hasProjects: false,
          userRegions: new Set(),
        })
      ).toBe(false)
    })

    it('shows when affects_project_creation is true and no region restriction', () => {
      expect(
        shouldShowBanner({
          incidents: [affectsCreation],
          hasProjects: false,
          userRegions: new Set(),
        })
      ).toBe(true)
    })

    it('shows when affects_project_creation is true even with a region restriction', () => {
      expect(
        shouldShowBanner({
          incidents: [usEast1AndCreation],
          hasProjects: false,
          userRegions: new Set(),
        })
      ).toBe(true)
    })
  })

  describe('user has projects, no region restriction', () => {
    it('shows when cache is absent', () => {
      expect(
        shouldShowBanner({
          incidents: [noCache],
          hasProjects: true,
          userRegions: new Set(['us-east-1']),
        })
      ).toBe(true)
    })

    it('shows when affected_regions is null', () => {
      expect(
        shouldShowBanner({
          incidents: [noRestrictions],
          hasProjects: true,
          userRegions: new Set(['us-east-1']),
        })
      ).toBe(true)
    })

    it('shows when affected_regions is an empty array', () => {
      expect(
        shouldShowBanner({
          incidents: [{ cache: { affected_regions: [], affects_project_creation: false } }],
          hasProjects: true,
          userRegions: new Set(['us-east-1']),
        })
      ).toBe(true)
    })
  })

  describe('user has projects, with region restriction', () => {
    it('shows when user has a primary database in an affected region', () => {
      expect(
        shouldShowBanner({
          incidents: [usEast1Only],
          hasProjects: true,
          userRegions: new Set(['us-east-1']),
        })
      ).toBe(true)
    })

    it('shows when user has a read replica in an affected region', () => {
      expect(
        shouldShowBanner({
          incidents: [
            { cache: { affected_regions: ['eu-west-1'], affects_project_creation: false } },
          ],
          hasProjects: true,
          userRegions: new Set(['us-east-1', 'eu-west-1']),
        })
      ).toBe(true)
    })

    it('shows when one of multiple affected regions matches', () => {
      expect(
        shouldShowBanner({
          incidents: [
            {
              cache: {
                affected_regions: ['us-east-1', 'ap-southeast-1'],
                affects_project_creation: false,
              },
            },
          ],
          hasProjects: true,
          userRegions: new Set(['ap-southeast-1']),
        })
      ).toBe(true)
    })

    it('does not show when user has no databases in any affected region', () => {
      expect(
        shouldShowBanner({
          incidents: [usEast1Only],
          hasProjects: true,
          userRegions: new Set(['eu-west-1', 'ap-southeast-1']),
        })
      ).toBe(false)
    })

    it('does not show when user has projects but no databases in affected region, even with affects_project_creation', () => {
      expect(
        shouldShowBanner({
          incidents: [usEast1AndCreation],
          hasProjects: true,
          userRegions: new Set(['eu-west-1']),
        })
      ).toBe(false)
    })
  })

  describe('multiple incidents', () => {
    it('shows when at least one incident matches even if others do not', () => {
      expect(
        shouldShowBanner({
          incidents: [usEast1Only, noRestrictions],
          hasProjects: true,
          userRegions: new Set(['eu-west-1']),
        })
      ).toBe(true)
    })

    it('does not show when no incident matches', () => {
      expect(
        shouldShowBanner({
          incidents: [usEast1Only, usEast1AndCreation],
          hasProjects: true,
          userRegions: new Set(['eu-west-1']),
        })
      ).toBe(false)
    })

    it('shows when any incident matches for a no-project user via affects_project_creation', () => {
      expect(
        shouldShowBanner({
          incidents: [usEast1Only, affectsCreation],
          hasProjects: false,
          userRegions: new Set(),
        })
      ).toBe(true)
    })
  })

  describe('hasUnknownRegions', () => {
    it('shows when regions are unknown and incident has a region restriction', () => {
      expect(
        shouldShowBanner({
          incidents: [usEast1Only],
          hasProjects: true,
          userRegions: new Set(),
          hasUnknownRegions: true,
        })
      ).toBe(true)
    })

    it('still applies no-projects check even when regions are unknown', () => {
      expect(
        shouldShowBanner({
          incidents: [usEast1Only],
          hasProjects: false,
          userRegions: new Set(),
          hasUnknownRegions: true,
        })
      ).toBe(false)
    })

    it('still shows for affects_project_creation with no projects even when regions are unknown', () => {
      expect(
        shouldShowBanner({
          incidents: [usEast1AndCreation],
          hasProjects: false,
          userRegions: new Set(),
          hasUnknownRegions: true,
        })
      ).toBe(true)
    })
  })
})
