import { vi } from 'vitest'

import type { OrganizationsService } from '@/data/organizations/organizations-service'
import type { PermissionsService } from '@/data/permissions/permissions-service'
import type { ProfileService } from '@/data/profile/profile-service'
import type { ProjectsService } from '@/data/projects/projects-service'
import type { AuthService } from '@/lib/services/auth-service'
import type { FeatureFlagService } from '@/lib/services/feature-flag-service'
import type { ServiceRegistry } from '@/lib/services/registry'

const mockProject = {
  id: 1,
  ref: 'test-project-ref',
  name: 'Test Project',
  status: 'ACTIVE_HEALTHY' as const,
  organization_id: 1,
  cloud_provider: 'AWS',
  region: 'us-east-1',
  inserted_at: '2024-01-01T00:00:00Z',
  subscription_id: 'sub-1',
  preview_branch_refs: [],
  connectionString: 'postgresql://postgres@db.test-project-ref.supabase.co:5432/postgres',
}

const mockOrganization = {
  id: 1,
  slug: 'test-org',
  name: 'Test Organization',
  billing_email: 'billing@example.com',
  managed_by: 'supabase' as const,
  plan: { id: 'free' as const, name: 'Free' },
  partner_id: undefined,
}

const mockProfile = {
  id: 1,
  username: 'testuser',
  primary_email: 'test@example.com',
  mobile: null as string | null,
  free_project_limit: 2,
  disabled_features: [] as string[],
}

const mockMfaAssuranceLevel = {
  currentLevel: 'aal1' as const,
  nextLevel: 'aal1' as const,
  currentAuthenticationMethods: [] as any[],
}

export function createMockProjectsService(overrides?: Partial<ProjectsService>): ProjectsService {
  return {
    getProjectDetail: vi.fn().mockResolvedValue(mockProject),
    ...overrides,
  }
}

export function createMockOrganizationsService(
  overrides?: Partial<OrganizationsService>
): OrganizationsService {
  return {
    getOrganizations: vi.fn().mockResolvedValue([mockOrganization]),
    ...overrides,
  }
}

export function createMockProfileService(overrides?: Partial<ProfileService>): ProfileService {
  return {
    getProfile: vi.fn().mockResolvedValue(mockProfile),
    ...overrides,
  }
}

export function createMockPermissionsService(
  overrides?: Partial<PermissionsService>
): PermissionsService {
  return {
    getPermissions: vi.fn().mockResolvedValue([]),
    ...overrides,
  }
}

export function createMockAuthService(overrides?: Partial<AuthService>): AuthService {
  return {
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getMfaAssuranceLevel: vi.fn().mockResolvedValue(mockMfaAssuranceLevel),
    ...overrides,
  }
}

export function createMockFeatureFlagService(
  overrides?: Partial<FeatureFlagService>
): FeatureFlagService {
  return {
    getConfigCatFlags: vi.fn().mockResolvedValue([]),
    getPostHogFlags: vi.fn().mockResolvedValue({}),
    ...overrides,
  }
}

/**
 * Creates a mock ServiceRegistry with sensible defaults.
 * Pass per-service overrides to customise behaviour in individual tests:
 *
 * ```ts
 * const registry = createMockRegistry({
 *   projects: createMockProjectsService({
 *     getProjectDetail: vi.fn().mockRejectedValue(new Error('not found')),
 *   }),
 * })
 * ```
 */
export function createMockRegistry(overrides?: Partial<ServiceRegistry>): ServiceRegistry {
  return {
    projects: createMockProjectsService(),
    organizations: createMockOrganizationsService(),
    profile: createMockProfileService(),
    permissions: createMockPermissionsService(),
    auth: createMockAuthService(),
    featureFlags: createMockFeatureFlagService(),
    ...overrides,
  }
}
