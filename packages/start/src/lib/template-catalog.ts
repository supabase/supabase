import {
  getDefaultEnabledTemplateIds as getDefaultEnabledTemplateIdsFromPackage,
  groupTemplatesByCategory as groupTemplatesByCategoryFromPackage,
  parseCategoriesManifest,
  sortCategories as sortCategoriesFromPackage,
  sortTemplates as sortTemplatesFromPackage,
  type Template as PackageTemplate,
  type TemplateSummary,
} from 'template-composer'

export type {
  Template,
  TemplateDependencies,
  TemplateFile,
  TemplateSummary,
} from 'template-composer'

export interface TemplateSource {
  listTemplates: () => Promise<PackageTemplate[]>
}

const categories = parseCategoriesManifest({
  categories: [
    'Core',
    'Auth',
    'Security',
    'API',
    'Storage',
    'Realtime',
    'Database',
    'AI',
    'Ecommerce',
    'Integrations',
    'Analytics',
    'Observability',
  ],
  featuredTemplates: ['database', 'functions', 'storage', 'auth', 'api'],
})

export function createMockTemplateSource(templates: PackageTemplate[]): TemplateSource {
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
