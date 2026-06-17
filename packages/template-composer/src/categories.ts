import type { TemplateSummary } from './schema'

export interface CategoriesManifest {
  /** Display order for categories. Categories not listed sort alphabetically after these. */
  categories: string[]
  /** Templates that should appear first within their category (e.g. core building blocks). */
  featuredTemplates: string[]
}

export function parseCategoriesManifest(value: unknown): CategoriesManifest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Categories manifest must be an object')
  }

  const record = value as Record<string, unknown>
  const categories = record.categories
  const featuredTemplates = record.featuredTemplates

  if (!Array.isArray(categories) || categories.some((item) => typeof item !== 'string')) {
    throw new Error('Categories manifest "categories" must be an array of strings')
  }

  if (
    !Array.isArray(featuredTemplates) ||
    featuredTemplates.some((item) => typeof item !== 'string')
  ) {
    throw new Error('Categories manifest "featuredTemplates" must be an array of strings')
  }

  return {
    categories: categories as string[],
    featuredTemplates: featuredTemplates as string[],
  }
}

export function sortCategories(categories: string[], manifest: CategoriesManifest): string[] {
  const order = manifest.categories
  return [...categories].sort((a, b) => {
    const aIndex = order.indexOf(a)
    const bIndex = order.indexOf(b)

    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1

    return aIndex - bIndex
  })
}

export function sortTemplates<T extends TemplateSummary>(
  templates: T[],
  manifest: CategoriesManifest
): T[] {
  const order = manifest.featuredTemplates
  return [...templates].sort((a, b) => {
    const aIndex = order.indexOf(a.id)
    const bIndex = order.indexOf(b.id)

    if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1

    return aIndex - bIndex
  })
}

export function groupTemplatesByCategory<T extends TemplateSummary>(
  templates: T[],
  manifest: CategoriesManifest
): Record<string, T[]> {
  const grouped = templates.reduce<Record<string, T[]>>((acc, template) => {
    acc[template.category] ??= []
    acc[template.category].push(template)
    return acc
  }, {})

  for (const category of Object.keys(grouped)) {
    grouped[category] = sortTemplates(grouped[category], manifest)
  }

  return grouped
}
