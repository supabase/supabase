import type { components } from 'api-types'

import enabledFeaturesRaw from './enabled-features.json' with { type: 'json' }

const enabledFeaturesStaticObj = enabledFeaturesRaw as Omit<typeof enabledFeaturesRaw, '$schema'>

type Profile = components['schemas']['ProfileResponse']

export type Feature = Profile['disabled_features'][number] | keyof typeof enabledFeaturesStaticObj

const disabledFeaturesStaticArray = Object.entries(enabledFeaturesStaticObj)
  .filter(([_, value]) => !value)
  .map(([key]) => key as Feature)

function checkFeature(feature: Feature, features: Set<Feature>) {
  return !features.has(feature)
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

function isFeatureEnabled<T extends Feature[]>(
  features: T,
  runtimeDisabledFeatures?: Feature[]
): { [key in FeatureToCamelCase<T[number]>]: boolean }
function isFeatureEnabled(features: Feature, runtimeDisabledFeatures?: Feature[]): boolean
function isFeatureEnabled<T extends Feature | Feature[]>(
  features: T,
  runtimeDisabledFeatures?: Feature[]
) {
  // Override is used to produce a filtered version of the docs search index
  // using the same sync setup as our normal search index
  if (process.env.ENABLED_FEATURES_OVERRIDE_DISABLE_ALL === 'true') {
    if (Array.isArray(features)) {
      return Object.fromEntries(features.map((feature) => [featureToCamelCase(feature), false]))
    }
    return false
  }

  const disabledFeatures = new Set([
    ...(runtimeDisabledFeatures ?? []),
    ...disabledFeaturesStaticArray,
  ])

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

export { isFeatureEnabled }
