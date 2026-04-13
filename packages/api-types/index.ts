import type {
  components as apiComponents,
  operations as apiOperations,
  paths as apiPaths,
} from './types/api'
import type {
  components as platformComponents,
  operations as platformOperations,
  paths as platformPaths,
} from './types/platform'

export type { webhooks, $defs } from './types/api'

export interface paths extends apiPaths, platformPaths {}
export interface operations extends apiOperations, platformOperations {}
export interface components {
  schemas: apiComponents['schemas'] & platformComponents['schemas']
  responses: apiComponents['responses'] & platformComponents['responses']
  parameters: apiComponents['parameters'] & platformComponents['parameters']
  requestBodies: apiComponents['requestBodies'] & platformComponents['requestBodies']
  headers: apiComponents['headers'] & platformComponents['headers']
  pathItems: apiComponents['pathItems'] & platformComponents['pathItems']
}
