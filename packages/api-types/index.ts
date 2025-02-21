export type { webhooks, $defs } from './types/api'
import type {
  paths as apiPaths,
  components as apiComponents,
  operations as apiOperations,
} from './types/api'
import type {
  paths as platformPaths,
  components as platformComponents,
  operations as platformOperations,
} from './types/platform'

export interface paths extends apiPaths, platformPaths {}

//  For backwards compat, this is exported as components instead of platformComponents to avoid a ton of file changes right now
export type { platformComponents as components }
export type { apiComponents }

export interface operations extends apiOperations, platformOperations {}
