import type { AuthService } from './auth-service'
import type { FeatureFlagService } from './feature-flag-service'
import type { OrganizationsService } from '@/data/organizations/organizations-service'
import type { PermissionsService } from '@/data/permissions/permissions-service'
import type { ProfileService } from '@/data/profile/profile-service'
import type { ProjectsService } from '@/data/projects/projects-service'

/**
 * Central registry of all injectable services.
 * Live implementations are wired in createLiveRegistry().
 * Mock implementations are provided in tests.
 */
export interface ServiceRegistry {
  auth: AuthService
  featureFlags: FeatureFlagService
  organizations: OrganizationsService
  permissions: PermissionsService
  profile: ProfileService
  projects: ProjectsService
}
