import { authServiceLive } from './auth-service'
import { featureFlagServiceLive } from './feature-flag-service'
import type { ServiceRegistry } from './registry'

export function createLiveRegistry(): ServiceRegistry {
  return {
    auth: authServiceLive,
    featureFlags: featureFlagServiceLive,
  }
}
