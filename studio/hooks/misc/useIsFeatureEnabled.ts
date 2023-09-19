import { Feature, useDisabledFeaturesQuery } from 'data/platform/disabled-features-query'

function checkFeature(feature: Feature, features?: Feature[]) {
  return !features?.includes(feature) ?? true
}

function useIsFeatureEnabled<T extends Feature[]>(features: T): { [key in T[number]]: boolean }
function useIsFeatureEnabled(features: Feature): boolean
function useIsFeatureEnabled<T extends Feature | Feature[]>(
  features: T
): boolean | { [key in T[number]]: boolean } {
  const { data } = useDisabledFeaturesQuery()
  console.log('data:', data)

  if (Array.isArray(features)) {
    return Object.fromEntries(
      features.map((feature) => [feature, checkFeature(feature, data)])
    ) as { [key in T[number]]: boolean }
  }

  return checkFeature(features, data)
}

export { useIsFeatureEnabled }
