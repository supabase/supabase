import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAppSidebarNavItems } from 'components/layouts/NavigationV2/useAppSidebarNavItems'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('lib/constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('lib/constants')
  return { ...actual, IS_PLATFORM: true }
})

vi.mock('next/router', () => ({
  useRouter: vi.fn().mockReturnValue({
    pathname: '/project/[ref]',
    asPath: '/project/test-ref',
    query: {},
  }),
}))

vi.mock('common', () => ({
  useFlag: vi.fn().mockReturnValue(false),
  useParams: vi.fn().mockReturnValue({ ref: 'test-ref', slug: undefined }),
  useIsMFAEnabled: vi.fn().mockReturnValue(false),
}))

vi.mock('hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: vi
    .fn()
    .mockReturnValue({ data: { slug: 'my-org', organization_requires_mfa: false } }),
}))

vi.mock('hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: vi
    .fn()
    .mockReturnValue({ data: { ref: 'test-ref', status: 'ACTIVE_HEALTHY' } }),
}))

vi.mock('hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: vi.fn((flags: string | string[]) => {
    if (typeof flags === 'string') return true
    return Object.fromEntries((flags as string[]).map((f) => [f.replace(/[:/]/g, ''), true]))
  }),
}))

vi.mock('components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useIsColumnLevelPrivilegesEnabled: vi.fn().mockReturnValue(false),
  useUnifiedLogsPreview: vi.fn().mockReturnValue({ isEnabled: false }),
}))

vi.mock('components/interfaces/Database/Replication/useIsETLPrivateAlpha', () => ({
  useIsETLPrivateAlpha: vi.fn().mockReturnValue(false),
}))

vi.mock('components/interfaces/Integrations/Landing/useInstalledIntegrations', () => ({
  useInstalledIntegrations: vi.fn().mockReturnValue({ installedIntegrations: [] }),
}))

vi.mock('data/database-extensions/database-extensions-query', () => ({
  useDatabaseExtensionsQuery: vi.fn().mockReturnValue({ data: undefined }),
}))

vi.mock('data/subscriptions/project-addons-query', () => ({
  useProjectAddonsQuery: vi.fn().mockReturnValue({ data: undefined }),
}))

vi.mock('components/layouts/ProjectSettingsLayout/SettingsMenu.utils', () => ({
  useGenerateSettingsMenu: vi.fn().mockReturnValue([]),
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useAppSidebarNavItems', () => {
  describe('scope detection', () => {
    it('detects project scope from pathname', () => {
      const { result } = renderHook(() => useAppSidebarNavItems())
      expect(result.current.isProjectScope).toBe(true)
    })

    it('respects explicit "organization" scope override', () => {
      const { result } = renderHook(() => useAppSidebarNavItems({ scope: 'organization' }))
      expect(result.current.isProjectScope).toBe(false)
    })

    it('respects explicit "project" scope override', () => {
      const { result } = renderHook(() => useAppSidebarNavItems({ scope: 'project' }))
      expect(result.current.isProjectScope).toBe(true)
    })
  })

  describe('projectItems', () => {
    it('includes Home and Project Settings when in project scope', () => {
      const { result } = renderHook(() => useAppSidebarNavItems({ scope: 'project' }))
      const titles = result.current.projectItems.map((i) => i.title)
      expect(titles).toContain('Home')
      expect(titles).toContain('Project Settings')
    })

    it('returns empty projectItems in organization scope', () => {
      const { result } = renderHook(() => useAppSidebarNavItems({ scope: 'organization' }))
      expect(result.current.projectItems).toHaveLength(0)
    })

    it('Home item is active when on the project home route', () => {
      const { result } = renderHook(() => useAppSidebarNavItems({ scope: 'project' }))
      const home = result.current.projectItems.find((i) => i.title === 'Home')
      expect(home?.isActive).toBe(true)
    })

    it('Home url points to the current project ref', () => {
      const { result } = renderHook(() => useAppSidebarNavItems({ scope: 'project' }))
      const home = result.current.projectItems.find((i) => i.title === 'Home')
      expect(home?.url).toBe('/project/test-ref')
    })

    it('Project Settings url uses general settings on IS_PLATFORM', () => {
      const { result } = renderHook(() => useAppSidebarNavItems({ scope: 'project' }))
      const settings = result.current.projectItems.find((i) => i.title === 'Project Settings')
      expect(settings?.url).toBe('/project/test-ref/settings/general')
    })
  })

  describe('organizationItems', () => {
    it('returns empty when no organizationSlug is available', () => {
      const { result } = renderHook(() => useAppSidebarNavItems({ scope: 'organization' }))
      // useParams returns slug: undefined, so organizationSlug = ''
      expect(result.current.organizationItems).toHaveLength(0)
    })
  })

  describe('isActiveHealthy', () => {
    it('returns true when project status is ACTIVE_HEALTHY', () => {
      const { result } = renderHook(() => useAppSidebarNavItems())
      expect(result.current.isActiveHealthy).toBe(true)
    })
  })

  describe('ref and organizationSlug', () => {
    it('exposes the current project ref', () => {
      const { result } = renderHook(() => useAppSidebarNavItems())
      expect(result.current.ref).toBe('test-ref')
    })

    it('exposes an empty organizationSlug when none is set', () => {
      const { result } = renderHook(() => useAppSidebarNavItems())
      expect(result.current.organizationSlug).toBe('')
    })
  })
})
