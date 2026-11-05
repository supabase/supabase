import type { paths as ApiPaths } from 'api-types'

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
    : ApiPaths[Path]
}
