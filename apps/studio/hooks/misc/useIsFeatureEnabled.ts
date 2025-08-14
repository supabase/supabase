import type { Profile } from 'data/profile/types'
import { useProfile } from 'lib/profile'
import enabledFeaturesStaticObj from '../../enabled-features.json'

export type Feature = Profile['disabled_features'][number] | keyof typeof enabledFeaturesStaticObj

const disabledFeaturesStaticArray = Object.entries(enabledFeaturesStaticObj)
  .filter(([_, value]) => !value)
  .map(([key]) => key as Feature)

function checkFeature(feature: Feature, features: Feature[]) {
  return !features.includes(feature)
}

type SnakeToCamelCase<S extends string> = S extends `${infer First}_${infer Rest}`
  ? `${First}${SnakeToCamelCase<Capitalize<Rest>>}`
  : S

type FeatureToCamelCase<S extends Feature> = S extends `${infer P}:${infer R}`
  ? `${SnakeToCamelCase<P>}${Capitalize<SnakeToCamelCase<R>>}`
  : SnakeToCamelCase<S>

function featureToCamelCase(feature: Feature) {
  return feature
    .replace(/:/g, '_')
    .split('_')
    .map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join('') as FeatureToCamelCase<typeof feature>
}

function useIsFeatureEnabled<T extends Feature[]>(
  features: T
): { [key in FeatureToCamelCase<T[number]>]: boolean }
function useIsFeatureEnabled(features: Feature): boolean
function useIsFeatureEnabled<T extends Feature | Feature[]>(features: T) {
  const { profile } = useProfile()
  const disabledFeatures = [
    ...new Set([...(profile?.disabled_features ?? []), ...disabledFeaturesStaticArray]),
  ]

  if (Array.isArray(features)) {
    return Object.fromEntries(
      features.map((feature) => [
        featureToCamelCase(feature),
        checkFeature(feature, disabledFeatures),
      ])
    )
  }

  return checkFeature(features, disabledFeatures)
}

export { useIsFeatureEnabled }
