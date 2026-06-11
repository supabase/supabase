import { canRemoveTemplate } from './composition/composition'
import {
  getPrimitiveForTemplate,
  getTemplateIdForPrimitive,
  type StartComposition,
} from './composition/start-composition'
import {
  DEFAULT_CONFIG,
  FRAMEWORKS,
  PRIM_ORDER,
  type AgentId,
  type ConnectionId,
  type FrameworkId,
  type OrmId,
  type PrimitiveId,
  type ProjectKind,
  type StartConfig,
} from './config'
import type { Template } from './template-catalog'

export interface StartConfigState {
  cfg: StartConfig
  setValue: <K extends keyof StartConfig>(key: K, value: StartConfig[K]) => void
  addTemplate: (id: string) => void
  removeTemplate: (id: string) => void
}

export function getDefaultSchemaTemplateIds(templates: Template[]): Set<string> {
  return new Set(
    templates
      .filter(
        (template) =>
          template.defaultEnabled &&
          template.files.some((file) => file.path.startsWith('supabase/schemas/'))
      )
      .map((template) => template.id)
  )
}

/** Drop unknown enum values and re-apply config invariants after URL or external updates. */
export function normalizeStartConfig(cfg: StartConfig, templates: Template[]): StartConfig {
  const availableTemplateIds = new Set(templates.map((template) => template.id))
  const framework = cfg.framework in FRAMEWORKS ? cfg.framework : DEFAULT_CONFIG.framework
  const primitives = cfg.primitives.filter((primitive) => PRIM_ORDER.includes(primitive))
  const templateIds = cfg.templateIds.filter((templateId) => availableTemplateIds.has(templateId))

  return {
    project: isProjectKind(cfg.project) ? cfg.project : DEFAULT_CONFIG.project,
    framework,
    shadcn: framework === 'none' ? false : cfg.shadcn,
    primitives: primitives.length > 0 ? primitives : DEFAULT_CONFIG.primitives,
    orm: isOrmId(cfg.orm) ? cfg.orm : DEFAULT_CONFIG.orm,
    connection: isConnectionId(cfg.connection) ? cfg.connection : DEFAULT_CONFIG.connection,
    agent: isAgentId(cfg.agent) ? cfg.agent : DEFAULT_CONFIG.agent,
    templateIds: templateIds.length > 0 ? templateIds : DEFAULT_CONFIG.templateIds,
  }
}

export function applyStartConfigUpdate<K extends keyof StartConfig>(
  current: StartConfig,
  key: K,
  value: StartConfig[K],
  options: { defaultSchemaTemplateIds: Set<string> }
): StartConfig {
  const next = { ...current, [key]: value }

  if (key === 'framework' && value === 'none') {
    next.shadcn = false
  }

  if (key === 'orm' && value !== 'none') {
    next.templateIds = next.templateIds.filter(
      (templateId) => !options.defaultSchemaTemplateIds.has(templateId)
    )
  }

  return next
}

export function applyAddTemplate(
  current: StartConfig,
  id: string,
  templates: Template[]
): StartConfig {
  const primitive = getCanonicalPrimitiveForTemplate(id)

  if (primitive) {
    return current.primitives.includes(primitive)
      ? current
      : { ...current, primitives: [...current.primitives, primitive] }
  }

  return current.templateIds.includes(id)
    ? current
    : { ...current, templateIds: [...current.templateIds, id] }
}

export function applyRemoveTemplate(
  current: StartConfig,
  id: string,
  composition: StartComposition,
  templates: Template[]
): StartConfig | null {
  if (!canRemoveTemplate(id, composition.selectedIds, templates)) return null

  const primitive = getCanonicalPrimitiveForTemplate(id)

  if (primitive) {
    return {
      ...current,
      primitives: current.primitives.filter((candidate) => candidate !== primitive),
    }
  }

  return {
    ...current,
    templateIds: current.templateIds.filter((templateId) => templateId !== id),
  }
}

export function createStartConfigState(
  cfg: StartConfig,
  setCfg: (updater: (current: StartConfig) => StartConfig) => void,
  templates: Template[],
  composition: StartComposition
): StartConfigState {
  const defaultSchemaTemplateIds = getDefaultSchemaTemplateIds(templates)

  const setValue = <K extends keyof StartConfig>(key: K, value: StartConfig[K]) => {
    setCfg((current) =>
      normalizeStartConfig(
        applyStartConfigUpdate(current, key, value, { defaultSchemaTemplateIds }),
        templates
      )
    )
  }

  const addTemplate = (id: string) => {
    setCfg((current) => normalizeStartConfig(applyAddTemplate(current, id, templates), templates))
  }

  const removeTemplate = (id: string) => {
    setCfg((current) => {
      const next = applyRemoveTemplate(current, id, composition, templates)
      return next ? normalizeStartConfig(next, templates) : current
    })
  }

  return { cfg, setValue, addTemplate, removeTemplate }
}

function getCanonicalPrimitiveForTemplate(templateId: string): PrimitiveId | undefined {
  const primitive = getPrimitiveForTemplate(templateId)
  return primitive && getTemplateIdForPrimitive(primitive) === templateId ? primitive : undefined
}

function isProjectKind(value: string): value is ProjectKind {
  return value === 'new' || value === 'existing'
}

function isOrmId(value: string): value is OrmId {
  return value === 'none' || value === 'drizzle' || value === 'prisma'
}

function isConnectionId(value: string): value is ConnectionId {
  return value === 'remote' || value === 'local'
}

function isAgentId(value: string): value is AgentId {
  return value === 'claude' || value === 'codex'
}
