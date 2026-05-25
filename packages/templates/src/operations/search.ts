import type { TemplateSummary } from '../schema'

export interface SearchQuery {
  text?: string
  category?: string
  tags?: string[]
}

export function filterTemplates<T extends TemplateSummary>(templates: T[], search: string): T[] {
  const normalizedSearch = search.trim().toLowerCase()

  if (!normalizedSearch) return templates

  return templates.filter(
    (template) =>
      template.name.toLowerCase().includes(normalizedSearch) ||
      template.description.toLowerCase().includes(normalizedSearch) ||
      template.id.toLowerCase().includes(normalizedSearch) ||
      (template.tags?.some((tag) => tag.toLowerCase().includes(normalizedSearch)) ?? false)
  )
}

export function queryTemplates<T extends TemplateSummary>(templates: T[], query: SearchQuery): T[] {
  let result = templates

  if (query.category) {
    result = result.filter((template) => template.category === query.category)
  }

  if (query.tags && query.tags.length > 0) {
    const requiredTags = query.tags.map((tag) => tag.toLowerCase())
    result = result.filter((template) => {
      const templateTags = (template.tags ?? []).map((tag) => tag.toLowerCase())
      return requiredTags.every((tag) => templateTags.includes(tag))
    })
  }

  if (query.text) {
    result = filterTemplates(result, query.text)
  }

  return result
}
