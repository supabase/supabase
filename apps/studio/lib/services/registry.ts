import type { AuthService } from './auth-service'
import type { FeatureFlagService } from './feature-flag-service'

/**
 * Central registry of all injectable services.
 * Live implementations are wired in createLiveRegistry().
 * Mock implementations are provided in tests.
 */
export interface ServiceRegistry {
  auth: AuthService
  featureFlags: FeatureFlagService
}
