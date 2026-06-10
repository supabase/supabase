import { PRIM_ORDER, type PrimitiveId, type StartConfig } from '../config'
import type { Template } from '../template-catalog'
import {
  mergeTemplates,
  resolveTemplateDependencies,
  type DependencyResolution,
  type MergeResult,
} from './composition'
import { extractCompositionResources, type CompositionResource } from './resources'

export const PRIMITIVE_TEMPLATE_IDS: Partial<Record<PrimitiveId, string>> = {
  database: 'database',
  auth: 'auth',
  storage: 'storage',
  functions: 'functions',
  dataapi: 'api',
}

export const CORE_TEMPLATE_IDS = new Set(['database', 'auth', 'storage', 'functions', 'api'])

export const TEMPLATE_ID_TO_PRIMITIVE: Record<string, PrimitiveId> = {
  database: 'database',
  auth: 'auth',
  storage: 'storage',
  functions: 'functions',
  api: 'dataapi',
}

export interface StartComposition {
  explicitTemplateIds: string[]
  selectedIds: Set<string>
  resolution: DependencyResolution
  mergeResult: MergeResult | null
  resources: CompositionResource[]
}

export function getPrimitiveForTemplate(templateId: string): PrimitiveId | undefined {
  return TEMPLATE_ID_TO_PRIMITIVE[templateId]
}

export function getTemplateIdForPrimitive(primitive: PrimitiveId): string | undefined {
  return PRIMITIVE_TEMPLATE_IDS[primitive]
}

export function getSelectedTemplateIds(cfg: StartConfig, templates: Template[]): string[] {
  const availableIds = new Set(templates.map((template) => template.id))
  const selected = new Set<string>()

  for (const primitive of cfg.primitives) {
    const templateId = getTemplateIdForPrimitive(primitive)
    if (templateId && availableIds.has(templateId)) selected.add(templateId)
  }

  for (const templateId of cfg.templateIds) {
    if (availableIds.has(templateId)) selected.add(templateId)
  }

  return templates.filter((template) => selected.has(template.id)).map((template) => template.id)
}

export function buildStartComposition(cfg: StartConfig, templates: Template[]): StartComposition {
  const explicitTemplateIds = getSelectedTemplateIds(cfg, templates)
  const resolution = resolveTemplateDependencies(explicitTemplateIds, templates)
  const mergeResult = resolution.resolved.length > 0 ? mergeTemplates(resolution.resolved) : null
  const resources = extractCompositionResources({ templates: resolution.resolved, mergeResult })

  return {
    explicitTemplateIds,
    selectedIds: new Set(explicitTemplateIds),
    resolution,
    mergeResult,
    resources,
  }
}

export function selectedPrimitives(cfg: StartConfig, composition: StartComposition): PrimitiveId[] {
  const selected = new Set<PrimitiveId>(cfg.primitives)

  for (const template of composition.resolution.resolved) {
    const primitive = getPrimitiveForTemplate(template.id)
    if (primitive) selected.add(primitive)

    for (const dependencyId of template.dependencies?.required ?? []) {
      const dependencyPrimitive = getPrimitiveForTemplate(dependencyId)
      if (dependencyPrimitive) selected.add(dependencyPrimitive)
    }
  }

  return PRIM_ORDER.filter((primitive) => selected.has(primitive))
}

export function selectedTemplateNames(composition: StartComposition): string[] {
  return composition.resolution.resolved.map((template) => template.name)
}
