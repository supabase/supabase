import { toTemplateSummary, type Template, type TemplateSummary } from '../schema'
import type { TemplateSource } from './types'

export function createEmbeddedSource(templates: Template[]): TemplateSource {
  const byId = new Map(templates.map((template) => [template.id, template]))

  return {
    async list(): Promise<TemplateSummary[]> {
      return templates.map(toTemplateSummary)
    },
    async get(id: string): Promise<Template> {
      const template = byId.get(id)
      if (!template) {
        throw new Error(`Template "${id}" not found`)
      }
      return template
    },
  }
}
