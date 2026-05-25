import type { Template } from './templates'

export function getDependencyTooltip(
  templateId: string,
  selectedIds: Set<string>,
  templates: Template[]
): string {
  const requiredBy = templates
    .filter(
      (template) =>
        selectedIds.has(template.id) && template.dependencies?.required?.includes(templateId)
    )
    .map((template) => template.name)

  if (requiredBy.length === 0) return 'Included as a dependency'
  if (requiredBy.length === 1) return `Required by ${requiredBy[0]}`
  return `Required by ${requiredBy.join(', ')}`
}
