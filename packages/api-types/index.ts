import type {
  components as apiV1Components,
  operations as apiV1Operations,
  paths as apiV1Paths,
} from './types/api-v1'
import type {
  components as apiV2Components,
  operations as apiV2Operations,
  paths as apiV2Paths,
} from './types/api-v2'
import type {
  components as platformComponents,
  operations as platformOperations,
  paths as platformPaths,
} from './types/platform'

export type { webhooks, $defs } from './types/api-v2'

export interface paths extends apiV2Paths, apiV1Paths, platformPaths {}
export interface operations extends apiV2Operations, apiV1Operations, platformOperations {}
export interface components {
  schemas: apiV2Components['schemas'] & apiV1Components['schemas'] & platformComponents['schemas']
  responses: apiV2Components['responses'] &
    apiV1Components['responses'] &
    platformComponents['responses']
  parameters: apiV2Components['parameters'] &
    apiV1Components['parameters'] &
    platformComponents['parameters']
  requestBodies: apiV2Components['requestBodies'] &
    apiV1Components['requestBodies'] &
    platformComponents['requestBodies']
  headers: apiV2Components['headers'] & apiV1Components['headers'] & platformComponents['headers']
  pathItems: apiV2Components['pathItems'] &
    apiV1Components['pathItems'] &
    platformComponents['pathItems']
}

export type { platformComponents, apiV1Components, apiV2Components }
