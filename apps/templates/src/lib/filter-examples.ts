import {
  EXAMPLE_CATEGORIES,
  SUPABASE_FEATURES,
  type Example,
  type ExampleCategory,
  type SupabaseFeature,
} from '@/data/types'

export interface GalleryFilters {
  query: string
  features: SupabaseFeature[]
  category?: ExampleCategory
}

export function isSupabaseFeature(value: string): value is SupabaseFeature {
  return Object.hasOwn(SUPABASE_FEATURES, value)
}

export function isExampleCategory(value: string): value is ExampleCategory {
  return Object.hasOwn(EXAMPLE_CATEGORIES, value)
}

/** Search text for an example, lowercased once per call. */
function getSearchText(example: Example) {
  return [
    example.title,
    example.tagline,
    example.author.name,
    ...example.stack,
    ...example.features.map((feature) => SUPABASE_FEATURES[feature].label),
  ]
    .join(' ')
    .toLowerCase()
}

/**
 * Filters examples by free-text query, category, and Supabase features.
 * An example must use every selected feature to match.
 */
export function filterExamples(examples: Example[], filters: GalleryFilters): Example[] {
  const terms = filters.query.toLowerCase().split(/\s+/).filter(Boolean)

  return examples.filter((example) => {
    if (filters.category && example.category !== filters.category) return false
    if (!filters.features.every((feature) => example.features.includes(feature))) return false
    if (terms.length === 0) return true
    const text = getSearchText(example)
    return terms.every((term) => text.includes(term))
  })
}

/** Number of examples per feature, for the filter chips. */
export function countByFeature(examples: Example[]): Record<SupabaseFeature, number> {
  const counts = Object.fromEntries(
    (Object.keys(SUPABASE_FEATURES) as SupabaseFeature[]).map((feature) => [feature, 0])
  ) as Record<SupabaseFeature, number>

  for (const example of examples) {
    for (const feature of example.features) counts[feature] += 1
  }
  return counts
}

/** Categories that at least one example uses, in their declared order. */
export function usedCategories(examples: Example[]): ExampleCategory[] {
  return (Object.keys(EXAMPLE_CATEGORIES) as ExampleCategory[]).filter((category) =>
    examples.some((example) => example.category === category)
  )
}

/** Features that at least one example uses, in their declared order. */
export function usedFeatures(examples: Example[]): SupabaseFeature[] {
  return (Object.keys(SUPABASE_FEATURES) as SupabaseFeature[]).filter((feature) =>
    examples.some((example) => example.features.includes(feature))
  )
}
