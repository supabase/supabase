import { projectComposerTemplates } from 'templates'

export interface TemplateFile {
  path: string
  content: string
}

export interface TemplateDependencies {
  required?: string[]
  optional?: string[]
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  tags?: string[]
  files: TemplateFile[]
  dependencies?: TemplateDependencies
  defaultEnabled?: boolean
}

export interface TemplateSource {
  listTemplates: () => Promise<Template[]>
}

export const categoryOrder = [
  'Core',
  'Auth',
  'API',
  'Storage',
  'Realtime',
  'Database',
  'Ecommerce',
  'Analytics',
  'Observability',
] as const

export const templateOrder = [
  'database',
  'functions',
  'storage',
  'auth',
  'api',
  'graphql',
] as const

export const mockTemplates: Template[] = projectComposerTemplates

export function createMockTemplateSource(templates: Template[] = mockTemplates): TemplateSource {
  return {
    async listTemplates() {
      return templates
    },
  }
}

export function getDefaultEnabledTemplateIds(templates: Template[]): string[] {
  return templates.filter((template) => template.defaultEnabled).map((template) => template.id)
}

export function sortTemplates(templates: Template[]): Template[] {
  return [...templates].sort((a, b) => {
    const aIndex = templateOrder.indexOf(a.id as (typeof templateOrder)[number])
    const bIndex = templateOrder.indexOf(b.id as (typeof templateOrder)[number])

    if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1

    return aIndex - bIndex
  })
}

export function groupTemplatesByCategory(templates: Template[]): Record<string, Template[]> {
  const grouped = templates.reduce<Record<string, Template[]>>((acc, template) => {
    acc[template.category] ??= []
    acc[template.category].push(template)
    return acc
  }, {})

  for (const category of Object.keys(grouped)) {
    grouped[category] = sortTemplates(grouped[category])
  }

  return grouped
}

export function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a as (typeof categoryOrder)[number])
    const bIndex = categoryOrder.indexOf(b as (typeof categoryOrder)[number])

    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1

    return aIndex - bIndex
  })
}
