import { isFeatureEnabled, type Feature } from 'common'
import { useProfile } from 'lib/profile'

function useIsFeatureEnabled<T extends Feature[]>(
  features: T
): ReturnType<typeof isFeatureEnabled<T>>
function useIsFeatureEnabled(features: Feature): ReturnType<typeof isFeatureEnabled>
function useIsFeatureEnabled<T extends Feature | Feature[]>(features: T) {
  const { profile } = useProfile()
  const disabledFeatures = profile?.disabled_features

  // This code branch is to make the type checker happy, it's intentionally
  // the same as the isFeatureEnabled function call below.
  if (Array.isArray(features)) {
    return isFeatureEnabled(features, disabledFeatures)
  }

  return isFeatureEnabled(features, disabledFeatures)
}

export { useIsFeatureEnabled }
