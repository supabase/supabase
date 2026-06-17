import type { Template, TemplateSummary } from '../schema'

export interface DependencyResolution<T extends TemplateSummary = Template> {
  resolved: T[]
  missingDeps: string[]
}

export function getTemplatesRequiringDependency<T extends TemplateSummary>(
  dependencyId: string,
  selectedIds: Iterable<string>,
  allTemplates: T[]
): T[] {
  const selected = new Set(selectedIds)

  return allTemplates.filter(
    (template) =>
      selected.has(template.id) && template.dependencies?.required?.includes(dependencyId)
  )
}

export function canRemoveTemplate(
  templateId: string,
  selectedIds: Iterable<string>,
  allTemplates: TemplateSummary[]
): boolean {
  return getTemplatesRequiringDependency(templateId, selectedIds, allTemplates).length === 0
}

export function resolveTemplateDependencies<T extends TemplateSummary>(
  selectedIds: string[],
  allTemplates: T[]
): DependencyResolution<T> {
  const templateMap = new Map(allTemplates.map((template) => [template.id, template]))
  const resolvedIds = new Set<string>()
  const missingDeps = new Set<string>()

  function resolve(id: string) {
    if (resolvedIds.has(id)) return

    const template = templateMap.get(id)

    if (!template) {
      missingDeps.add(id)
      return
    }

    for (const depId of template.dependencies?.required ?? []) {
      resolve(depId)
    }

    resolvedIds.add(id)
  }

  for (const id of selectedIds) {
    resolve(id)
  }

  return {
    resolved: Array.from(resolvedIds)
      .map((id) => templateMap.get(id))
      .filter((template): template is T => Boolean(template)),
    missingDeps: Array.from(missingDeps),
  }
}

export function getDefaultEnabledTemplateIds(templates: TemplateSummary[]): string[] {
  return templates.filter((template) => template.defaultEnabled).map((template) => template.id)
}

export type { Template }
