import type { Template } from './templates'

export function filterTemplates(templates: Template[], search: string): Template[] {
  const normalizedSearch = search.trim().toLowerCase()

  if (!normalizedSearch) return templates

  return templates.filter((template) => {
    return (
      template.name.toLowerCase().includes(normalizedSearch) ||
      template.description.toLowerCase().includes(normalizedSearch) ||
      template.id.toLowerCase().includes(normalizedSearch) ||
      (template.tags?.some((tag) => tag.toLowerCase().includes(normalizedSearch)) ?? false)
    )
  })
}
