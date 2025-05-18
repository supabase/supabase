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
export interface operations extends apiOperations, platformOperations {}
export interface components {
  schemas: apiComponents['schemas'] & platformComponents['schemas']
  responses: apiComponents['responses'] & platformComponents['responses']
  parameters: apiComponents['parameters'] & platformComponents['parameters']
  requestBodies: apiComponents['requestBodies'] & platformComponents['requestBodies']
  headers: apiComponents['headers'] & platformComponents['headers']
  pathItems: apiComponents['pathItems'] & platformComponents['pathItems']
}
