import {
  categories,
  templates as embeddedTemplates,
  getDefaultEnabledTemplateIds as getDefaultEnabledTemplateIdsFromPackage,
  groupTemplatesByCategory as groupTemplatesByCategoryFromPackage,
  sortCategories as sortCategoriesFromPackage,
  sortTemplates as sortTemplatesFromPackage,
  type Template as PackageTemplate,
  type TemplateSummary,
} from 'templates'

export type { Template, TemplateDependencies, TemplateFile, TemplateSummary } from 'templates'

export interface TemplateSource {
  listTemplates: () => Promise<PackageTemplate[]>
}

export const mockTemplates: PackageTemplate[] = embeddedTemplates

export function getStartTemplates(): PackageTemplate[] {
  return embeddedTemplates
}

export function createMockTemplateSource(
  templates: PackageTemplate[] = mockTemplates
): TemplateSource {
  return {
    async listTemplates() {
      return templates
    },
  }
}

export function getDefaultEnabledTemplateIds(templates: TemplateSummary[]): string[] {
  return getDefaultEnabledTemplateIdsFromPackage(templates)
}

export function sortTemplates<T extends TemplateSummary>(templates: T[]): T[] {
  return sortTemplatesFromPackage(templates, categories)
}

export function groupTemplatesByCategory<T extends TemplateSummary>(
  templates: T[]
): Record<string, T[]> {
  return groupTemplatesByCategoryFromPackage(templates, categories)
}

export function sortCategories(cats: string[]): string[] {
  return sortCategoriesFromPackage(cats, categories)
}
