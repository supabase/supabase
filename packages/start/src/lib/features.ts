/**
 * Bridge between the `templates` workspace package and the get-started page.
 *
 * This is the key piece of code-sharing with the www composer: the "Additional
 * features" rail and the per-feature setup steps are derived from the same
 * embedded template registry the composer consumes, rather than a hardcoded
 * list. Adding a template to the package surfaces it here automatically.
 */
import { categories, inferLanguage, sortTemplates, templates, type Template } from 'templates'

import { PRIM_ORDER, PRIMITIVES, type PrimitiveId, type StartConfig } from './config'

/**
 * Template IDs that map onto rail primitives rather than being optional
 * "additional features". These are filtered out of the features list.
 */
const CORE_TEMPLATE_IDS = new Set(['database', 'functions', 'storage', 'auth', 'api', 'graphql'])

/** Maps a template-registry dependency ID to a rail primitive ID. */
const TEMPLATE_TO_PRIMITIVE: Record<string, PrimitiveId> = {
  database: 'database',
  auth: 'auth',
  storage: 'storage',
  functions: 'functions',
  api: 'dataapi',
  graphql: 'dataapi',
}

export interface StartFeature {
  id: string
  name: string
  description: string
  category: string
  /** Rail primitives this feature switches on when selected. */
  neededPrimitives: PrimitiveId[]
  /** Other feature templates this one depends on (also auto-selected). */
  neededFeatureIds: string[]
  template: Template
}

function requiredIds(template: Template): string[] {
  return template.dependencies?.required ?? []
}

function neededPrimitives(template: Template): PrimitiveId[] {
  const prims = new Set<PrimitiveId>()
  for (const id of requiredIds(template)) {
    const prim = TEMPLATE_TO_PRIMITIVE[id]
    if (prim) prims.add(prim)
  }
  return PRIM_ORDER.filter((p) => prims.has(p))
}

/**
 * The list of selectable additional features, sorted with the same
 * category-aware ordering the composer template browser uses.
 */
export function getStartFeatures(): StartFeature[] {
  const featureTemplates = templates.filter((t) => !CORE_TEMPLATE_IDS.has(t.id))
  const sorted = sortTemplates(featureTemplates, categories)
  return sorted.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    neededPrimitives: neededPrimitives(template),
    neededFeatureIds: requiredIds(template).filter(
      (id) => !TEMPLATE_TO_PRIMITIVE[id] && !CORE_TEMPLATE_IDS.has(id)
    ),
    template,
  }))
}

export type StartFeatureMap = Record<string, StartFeature>

export function indexFeatures(features: StartFeature[]): StartFeatureMap {
  return Object.fromEntries(features.map((f) => [f.id, f]))
}

/** Selected features in registry order. */
export function selectedFeatures(cfg: StartConfig, features: StartFeature[]): StartFeature[] {
  const selected = new Set(cfg.features)
  return features.filter((f) => selected.has(f.id))
}

/** Union of every primitive required by the selected features. */
export function featureNeeds(cfg: StartConfig, features: StartFeature[]): Set<PrimitiveId> {
  const needs = new Set<PrimitiveId>()
  for (const feature of selectedFeatures(cfg, features)) {
    for (const prim of feature.neededPrimitives) needs.add(prim)
  }
  return needs
}

/** Explicitly-selected primitives plus those required by selected features. */
export function selectedPrims(cfg: StartConfig, features: StartFeature[]): PrimitiveId[] {
  const needs = featureNeeds(cfg, features)
  return PRIM_ORDER.filter((p) => cfg.primitives.includes(p) || needs.has(p))
}

export function primLabels(cfg: StartConfig, features: StartFeature[]): string[] {
  return selectedPrims(cfg, features).map((p) => PRIMITIVES[p].label)
}

/**
 * Maps the template package's language ids onto the languages the shared
 * `ui-patterns` CodeBlock has registered for syntax highlighting.
 */
export function toCodeBlockLang(langOrPath: string): string {
  // A path (e.g. "supabase/schemas/x.sql") — infer from the extension.
  const raw =
    langOrPath.includes('/') || langOrPath.includes('.') ? inferLanguage(langOrPath) : langOrPath

  switch (raw) {
    case 'terminal':
      return 'bash'
    case 'typescript':
    case 'tsx':
    case 'ts':
      return 'ts'
    case 'javascript':
    case 'jsx':
    case 'js':
      return 'js'
    case 'sql':
      return 'sql'
    case 'toml':
      return 'toml'
    case 'json':
      return 'json'
    case 'text':
      return 'bash'
    default:
      return raw
  }
}
