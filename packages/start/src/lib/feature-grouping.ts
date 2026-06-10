/**
 * Groups the additional-feature list by template category for the rail,
 * reusing the same category ordering the www composer browser uses.
 */
import { categories, sortCategories } from 'templates'

import { type StartFeature } from './features'

export interface FeatureGroup {
  category: string
  features: StartFeature[]
}

export function groupFeaturesByCategory(features: StartFeature[]): FeatureGroup[] {
  const byCategory = new Map<string, StartFeature[]>()
  for (const feature of features) {
    const group = byCategory.get(feature.category) ?? []
    group.push(feature)
    byCategory.set(feature.category, group)
  }
  const orderedCategories = sortCategories(Array.from(byCategory.keys()), categories)
  return orderedCategories.map((category) => ({
    category,
    features: byCategory.get(category) ?? [],
  }))
}
