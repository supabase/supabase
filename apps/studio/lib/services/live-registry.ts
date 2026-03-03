import { authServiceLive } from './auth-service'
import { featureFlagServiceLive } from './feature-flag-service'
import type { ServiceRegistry } from './registry'
import { organizationsServiceLive } from '@/data/organizations/organizations-service-live'
import { permissionsServiceLive } from '@/data/permissions/permissions-service-live'
import { profileServiceLive } from '@/data/profile/profile-service-live'
import { projectsServiceLive } from '@/data/projects/projects-service-live'

export function createLiveRegistry(): ServiceRegistry {
  return {
    auth: authServiceLive,
    featureFlags: featureFlagServiceLive,
    organizations: organizationsServiceLive,
    permissions: permissionsServiceLive,
    profile: profileServiceLive,
    projects: projectsServiceLive,
  }
}
