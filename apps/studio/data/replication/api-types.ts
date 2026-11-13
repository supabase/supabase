import type { paths as ApiPaths } from 'api-types'

// Response-only compatibility until production OpenAPI includes unreadable destinations.
export type DestinationWireResponse<T> = T extends { destinations: (infer Destination)[] }
  ? Omit<T, 'destinations'> & { destinations: DestinationWireResponse<Destination>[] }
  : T extends { config: infer Config }
    ? Omit<T, 'config'> & { config: Config | { unknown: Record<string, never> } }
    : T

type DestinationWireOperation<T> = T extends { responses: infer Responses }
  ? Omit<T, 'responses'> & {
      responses: {
        [Status in keyof Responses]: Responses[Status] extends { content: infer Content }
          ? Omit<Responses[Status], 'content'> & {
              content: {
                [Mime in keyof Content]: Mime extends 'application/json'
                  ? DestinationWireResponse<Content[Mime]>
                  : Content[Mime]
              }
            }
          : Responses[Status]
      }
    }
  : T

// Readers deploy before platform starts returning strings; keep generated types matched to production.
export type PipelineWireResponse<T> = T extends { pipelines: (infer Pipeline)[] }
  ? Omit<T, 'pipelines'> & { pipelines: PipelineWireResponse<Pipeline>[] }
  : {
      [Key in keyof T]: Key extends 'id' | 'pipeline_id'
        ? string | number | Extract<T[Key], null | undefined>
        : T[Key]
    }

type WireResponse<T> = T extends { content: infer Content }
  ? Omit<T, 'content'> & {
      content: {
        [Mime in keyof Content]: Mime extends 'application/json'
          ? PipelineWireResponse<Content[Mime]>
          : Content[Mime]
      }
    }
  : T

type WireOperation<T> = T extends { parameters: infer Params; responses: infer Responses }
  ? Omit<T, 'parameters' | 'responses'> & {
      parameters: Params extends { path: infer Path }
        ? Omit<Params, 'path'> & {
            path: { [Key in keyof Path]: Key extends 'pipeline_id' ? string | number : Path[Key] }
          }
        : Params
      responses: { [Status in keyof Responses]: WireResponse<Responses[Status]> }
    }
  : T

export type ReplicationCompatiblePaths = {
  [Path in keyof ApiPaths]: Path extends
    | `/platform/replication/${string}/pipelines${string}`
    | `/platform/replication/${string}/destinations-pipelines${string}`
    | `/platform/warehouse/${string}/setup`
    | `/platform/warehouse/${string}/setup-status`
    ? { [Method in keyof ApiPaths[Path]]: WireOperation<ApiPaths[Path][Method]> }
    : Path extends
          | '/platform/replication/{ref}/destinations'
          | '/platform/replication/{ref}/destinations/{destination_id}'
      ? {
          [Method in keyof ApiPaths[Path]]: Method extends 'get'
            ? DestinationWireOperation<ApiPaths[Path][Method]>
            : ApiPaths[Path][Method]
        }
      : ApiPaths[Path]
}
