import type { Example } from './types'

const modules = import.meta.glob<{ example: Example }>('./examples/*.ts', { eager: true })

/**
 * Every file in `./examples` that exports `example` is registered automatically.
 * Featured examples come first, then the most recently updated.
 */
export const EXAMPLES: Example[] = Object.values(modules)
  .map((module) => module.example)
  .sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    return b.updatedAt.localeCompare(a.updatedAt)
  })

export function getExample(slug: string): Example | undefined {
  return EXAMPLES.find((example) => example.slug === slug)
}

export function getRelatedExamples(example: Example, limit = 3): Example[] {
  return EXAMPLES.filter((other) => other.slug !== example.slug)
    .map((other) => ({
      other,
      score:
        other.features.filter((feature) => example.features.includes(feature)).length +
        (other.category === example.category ? 1 : 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ other }) => other)
}
