import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

/**
 * Whether an edge function's `verify_jwt` gate can be satisfied on this deployment.
 *
 * `verify_jwt` is the platform's *legacy* auth check: it only accepts a JWT signed by the project's
 * legacy JWT secret. Deployments with legacy JWT keys turned off have no such secret, so nothing can
 * pass the gate — not a publishable key, not a disabled `anon` key — and a function with
 * `verify_jwt` on rejects every request with `UNAUTHORIZED_NO_AUTH_HEADER` before the handler runs.
 *
 * Gate anything that can turn `verify_jwt` on behind this.
 */
export const useIsJwtVerificationAvailable = () => {
  const { projectSettingsLegacyJwtKeys } = useIsFeatureEnabled(['project_settings:legacy_jwt_keys'])
  return projectSettingsLegacyJwtKeys
}
