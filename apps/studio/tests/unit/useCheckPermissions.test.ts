import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { customRenderHook } from 'tests/lib/custom-render'
import { PermissionAction } from '@supabase/shared-types/out/constants'

vi.mock('common', () => ({
  useIsLoggedIn: vi.fn(),
  useParams: vi.fn(),
}))

vi.mock('lib/constants', () => ({
  IS_PLATFORM: true,
  API_URL: 'http://localhost:54321',
}))

vi.mock('data/permissions/permissions-query', () => ({
  usePermissionsQuery: vi.fn(),
}))

vi.mock('data/organizations/organizations-query', () => ({
  useOrganizationsQuery: vi.fn(),
}))

vi.mock('data/projects/project-detail-query', () => ({
  useProjectDetailQuery: vi.fn(),
}))

vi.mock('hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: vi.fn(),
}))

vi.mock('hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: vi.fn(),
}))

import { useIsLoggedIn } from 'common'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'

import * as constants from 'lib/constants'

describe('useAsyncCheckProjectPermissions', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    vi.clearAllMocks()

    vi.mocked(usePermissionsQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isSuccess: false,
    } as any)

    vi.mocked(useSelectedOrganizationQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isSuccess: false,
    } as any)

    vi.mocked(useSelectedProjectQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isSuccess: false,
    } as any)
  })

  const mockPermissions = [
    {
      actions: [PermissionAction.READ],
      condition: null as any, // condition can be null, which means it passes
      organization_slug: 'test-org',
      resources: ['api_keys'],
      restrictive: false,
      project_refs: ['test-project'],
    },
  ]

  const mockOrganization = {
    id: 1,
    name: 'Test Organization',
    slug: 'test-org',
    billing_email: 'billing@test.com',
    project_limit: 2,
    members: [],
    is_owner: true,
  }

  const mockProject = {
    id: 1,
    name: 'Test Project',
    ref: 'test-project',
    organization_id: 1,
    cloud_provider: 'FLY',
    status: 'ACTIVE_HEALTHY',
    region: 'ap-southeast-1',
    inserted_at: new Date().toISOString(),
    subscription_id: 'sub-id',
    parent_project_ref: undefined,
  }

  it('should return loading state when not logged in', () => {
    vi.mocked(useIsLoggedIn).mockReturnValue(false)

    const { result } = customRenderHook(() => useAsyncCheckProjectPermissions('read', 'api_keys'), {
      queryClient,
    })

    expect(result.current).toEqual({
      isLoading: true,
      isSuccess: false,
      can: false,
    })
  })

  it('should return success state when not on platform', () => {
    vi.mocked(useIsLoggedIn).mockReturnValue(true)

    const isPlatformSpy = vi.spyOn(constants, 'IS_PLATFORM', 'get')
    isPlatformSpy.mockReturnValue(false)

    const { result } = customRenderHook(() => useAsyncCheckProjectPermissions('read', 'api_keys'), {
      queryClient,
    })

    expect(result.current).toEqual({
      isLoading: false,
      isSuccess: true,
      can: true,
    })

    isPlatformSpy.mockRestore()
  })

  it('should return false when permissions are not yet loaded', () => {
    vi.mocked(useIsLoggedIn).mockReturnValue(true)

    const { result } = customRenderHook(() => useAsyncCheckProjectPermissions('read', 'api_keys'), {
      queryClient,
    })

    expect(result.current.can).toBe(false)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isSuccess).toBe(false)
  })

  it('should return false when organization is not yet loaded', () => {
    vi.mocked(useIsLoggedIn).mockReturnValue(true)

    vi.mocked(usePermissionsQuery).mockReturnValue({
      data: mockPermissions,
      isLoading: false,
      isSuccess: true,
    } as any)

    const { result } = customRenderHook(() => useAsyncCheckProjectPermissions('read', 'api_keys'), {
      queryClient,
    })

    expect(result.current.can).toBe(false)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isSuccess).toBe(false)
  })

  it('should return false when project is not yet loaded', () => {
    vi.mocked(useIsLoggedIn).mockReturnValue(true)

    vi.mocked(usePermissionsQuery).mockReturnValue({
      data: mockPermissions,
      isLoading: false,
      isSuccess: true,
    } as any)

    vi.mocked(useSelectedOrganizationQuery).mockReturnValue({
      data: mockOrganization,
      isLoading: false,
      isSuccess: true,
    } as any)

    const { result } = customRenderHook(() => useAsyncCheckProjectPermissions('read', 'api_keys'), {
      queryClient,
    })

    expect(result.current.can).toBe(false)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isSuccess).toBe(false)
  })

  it('should return true when all data is loaded and permissions match', () => {
    vi.mocked(useIsLoggedIn).mockReturnValue(true)

    vi.mocked(usePermissionsQuery).mockReturnValue({
      data: mockPermissions,
      isLoading: false,
      isSuccess: true,
    } as any)

    vi.mocked(useSelectedOrganizationQuery).mockReturnValue({
      data: mockOrganization,
      isLoading: false,
      isSuccess: true,
    } as any)

    vi.mocked(useSelectedProjectQuery).mockReturnValue({
      data: mockProject,
      isLoading: false,
      isSuccess: true,
    } as any)

    const { result } = customRenderHook(
      () => useAsyncCheckProjectPermissions(PermissionAction.READ, 'api_keys'),
      {
        queryClient,
      }
    )

    expect(result.current.can).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(true)
  })

  it('should return false when permissions do not match', () => {
    vi.mocked(useIsLoggedIn).mockReturnValue(true)

    vi.mocked(usePermissionsQuery).mockReturnValue({
      data: mockPermissions,
      isLoading: false,
      isSuccess: true,
    } as any)

    vi.mocked(useSelectedOrganizationQuery).mockReturnValue({
      data: mockOrganization,
      isLoading: false,
      isSuccess: true,
    } as any)

    vi.mocked(useSelectedProjectQuery).mockReturnValue({
      data: mockProject,
      isLoading: false,
      isSuccess: true,
    } as any)

    const { result } = customRenderHook(
      () => useAsyncCheckProjectPermissions('write', 'api_keys'),
      { queryClient }
    )

    expect(result.current.can).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(true)
  })

  it('should handle race condition by not computing permissions until all data is loaded', async () => {
    vi.mocked(useIsLoggedIn).mockReturnValue(true)

    vi.mocked(usePermissionsQuery).mockReturnValue({
      data: mockPermissions,
      isLoading: false,
      isSuccess: true,
    } as any)

    // Organization and project still loading (default from beforeEach)
    // This should make useGetProjectPermissions return isSuccess: false

    const { result, rerender } = customRenderHook(
      () => useAsyncCheckProjectPermissions(PermissionAction.READ, 'api_keys'),
      {
        queryClient,
      }
    )

    // Should return false while loading, not compute permissions
    // The useMemo should return false because isPermissionsSuccess is false
    expect(result.current.can).toBe(false)
    expect(result.current.isLoading).toBe(true)

    // Now simulate org loading completing
    vi.mocked(useSelectedOrganizationQuery).mockReturnValue({
      data: mockOrganization,
      isLoading: false,
      isSuccess: true,
    } as any)

    rerender()

    // Should still return false because project is still loading
    // useGetProjectPermissions should still return isSuccess: false
    expect(result.current.can).toBe(false)
    expect(result.current.isLoading).toBe(true)

    // Now simulate project loading completing
    vi.mocked(useSelectedProjectQuery).mockReturnValue({
      data: mockProject,
      isLoading: false,
      isSuccess: true,
    } as any)

    rerender()

    // Now should compute permissions and return true
    // useGetProjectPermissions should now return isSuccess: true
    expect(result.current.can).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(true)
  })

  it('should work with overrides', () => {
    vi.mocked(useIsLoggedIn).mockReturnValue(true)

    // When overrides are used, the underlying queries are disabled and should not be loading.
    vi.mocked(usePermissionsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isSuccess: false,
    } as any)
    vi.mocked(useSelectedOrganizationQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isSuccess: false,
    } as any)
    vi.mocked(useSelectedProjectQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isSuccess: false,
    } as any)

    const { result } = customRenderHook(
      () =>
        useAsyncCheckProjectPermissions(PermissionAction.READ, 'api_keys', undefined, {
          organizationSlug: 'test-org',
          projectRef: 'test-project',
          permissions: mockPermissions,
        }),
      { queryClient }
    )

    // With overrides, the hook should work without waiting for queries
    expect(result.current.can).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSuccess).toBe(true)
  })
})
