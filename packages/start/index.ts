// The unified get-started experience.
export { default as StartClient } from './src/StartClient'
export { useControlledStartConfig } from './src/hooks/useControlledStartConfig'
export { useStartConfig } from './src/hooks/useStartConfig'
export {
  AGENTS,
  DEFAULT_CONFIG,
  FRAMEWORKS,
  ORMS,
  PRIMITIVES,
  PRIM_ORDER,
  type StartConfig,
} from './src/lib/config'
export { buildAgentPlan } from './src/lib/agent-plan'
export { buildProjectCodePlan, type ProjectCodePlan } from './src/lib/project-code-plan'
export {
  buildStartComposition,
  selectedPrimitives,
  selectedTemplateNames,
} from './src/lib/composition/start-composition'
export {
  DEFAULT_START_SEARCH_PARAMS,
  parseStartConfigFromSearchParams,
  startConfigToSearchParams,
  startSearchParamsToConfig,
  type StartSearchParams,
} from './src/lib/start-search-params'
export type { StartConfigState } from './src/lib/start-config-state'
export type {
  Template,
  TemplateDependencies,
  TemplateFile,
  TemplateSummary,
} from './src/lib/template-catalog'
