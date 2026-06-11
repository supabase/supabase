import {
  DEFAULT_CONFIG,
  type AgentId,
  type ConnectionId,
  type FrameworkId,
  type OrmId,
  type PrimitiveId,
  type ProjectKind,
  type StartConfig,
} from './config'
import { normalizeStartConfig } from './start-config-state'
import type { Template } from './template-catalog'

/** URL/search-param shape for the get-started configurator (framework-agnostic). */
export interface StartSearchParams {
  project: ProjectKind
  framework: FrameworkId
  shadcn: boolean
  primitives: PrimitiveId[]
  orm: OrmId
  connection: ConnectionId
  agent: AgentId
  /** Feature template IDs selected beyond core primitives. */
  templates: string[]
}

export function startSearchParamsToConfig(params: StartSearchParams): StartConfig {
  return {
    project: params.project,
    framework: params.framework,
    shadcn: params.shadcn,
    primitives: params.primitives,
    orm: params.orm,
    connection: params.connection,
    agent: params.agent,
    templateIds: params.templates,
  }
}

export function startConfigToSearchParams(cfg: StartConfig): StartSearchParams {
  return {
    project: cfg.project,
    framework: cfg.framework,
    shadcn: cfg.shadcn,
    primitives: cfg.primitives,
    orm: cfg.orm,
    connection: cfg.connection,
    agent: cfg.agent,
    templates: cfg.templateIds,
  }
}

export function parseStartConfigFromSearchParams(
  params: StartSearchParams,
  templates: Template[]
): StartConfig {
  return normalizeStartConfig(startSearchParamsToConfig(params), templates)
}

export const DEFAULT_START_SEARCH_PARAMS = startConfigToSearchParams(DEFAULT_CONFIG)
