import { useQuery } from '@tanstack/react-query'

import { docsKeys } from './keys'
import { constructHeaders, fetchHandler, handleError } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type ProjectJsonSchemaVariables = {
  projectRef?: string
  schemas?: string[]
}

type ProjectJsonSchemaMethod = {
  tags: string[]
  summary: string
  responses: {
    [key: string]: any
  }
  parameters: { [key: string]: string }[]
}

export type ProjectJsonSchemaDefinitions = {
  [key: string]: {
    type: string
    description: string
    required: string[]
    properties: {
      [key: string]: {
        type: string
        format: string
        description?: string
        enum?: string[]
      }
    }
  }
}

export type ProjectJsonSchemaPaths = {
  [key: string]: {
    get?: ProjectJsonSchemaMethod
    post?: ProjectJsonSchemaMethod
    patch?: ProjectJsonSchemaMethod
    delete?: ProjectJsonSchemaMethod
  }
}

export type ProjectJsonSchemaResponse = {
  basePath: string
  consumes: string[]
  definitions: ProjectJsonSchemaDefinitions
  externalDocs: { description: string; url: string }
  host: string
  info: {
    title: string
    description: string
    version: string
  }
  parameters: {
    [key: string]: {
      default?: string
      description: string
      in: string
      name: string
      required: boolean
      type?: string
      schema?: { [key: string]: string }
    }
  }
  paths: ProjectJsonSchemaPaths
  produces: string[]
  schemes: string[]
  swagger: string
}

type MergeableSchemaData = {
  definitions?: Record<string, unknown>
  paths?: Record<string, unknown>
}

export type SchemaSpec<TData extends MergeableSchemaData = ProjectJsonSchemaResponse> = {
  schema: string
  data: TData
}

type SettledSchemaSpec<TData extends MergeableSchemaData = ProjectJsonSchemaResponse> =
  PromiseSettledResult<SchemaSpec<TData>>

export function resolveDocsApiUrl(path: string) {
  const baseUrl = API_URL?.replace('/platform', '')
  const target = `${baseUrl}${path}`
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8082'

  return new URL(target, origin)
}

function shouldQualifySchema(schema: string, schemas: string[]) {
  return schema !== 'public' || schemas.length > 1
}

export function getQualifiedEntityName(schema: string, name: string, schemas: string[]) {
  return shouldQualifySchema(schema, schemas) ? `${schema}.${name}` : name
}

export function getQualifiedPath(schema: string, path: string, schemas: string[]) {
  if (path.startsWith('/rpc/')) {
    const functionName = path.replace('/rpc/', '')
    return `/rpc/${getQualifiedEntityName(schema, functionName, schemas)}`
  }

  if (path !== '/') {
    const resourceName = path.replace(/^\//, '')
    return `/${getQualifiedEntityName(schema, resourceName, schemas)}`
  }

  return path
}

export function getTargetSchemas(schemas?: string[]) {
  return schemas && schemas.length > 0 ? schemas : ['public']
}

export function mergeSchemaResponses<TData extends MergeableSchemaData>(
  schemaSpecs: SchemaSpec<TData>[],
  schemas: string[] = schemaSpecs.map(({ schema }) => schema)
) {
  const merged = {
    ...(schemaSpecs[0]?.data ?? {}),
    definitions: {},
    paths: {},
  } as TData & Required<MergeableSchemaData>

  for (const { schema, data } of schemaSpecs) {
    for (const [path, value] of Object.entries(data.paths ?? {})) {
      merged.paths[getQualifiedPath(schema, path, schemas)] = value
    }

    for (const [name, definition] of Object.entries(data.definitions ?? {})) {
      merged.definitions[getQualifiedEntityName(schema, name, schemas)] = definition
    }
  }

  return merged as TData
}

export function isAbortError(error: unknown) {
  return (
    error instanceof Error && (error.name === 'AbortError' || error.message.includes('AbortError'))
  )
}

export function getResolvedSchemaSpecs<TData extends MergeableSchemaData>(
  schemaSpecs: SettledSchemaSpec<TData>[],
  schemas: string[],
  subject: string
) {
  const abortedResult = schemaSpecs.find(
    (result) => result.status === 'rejected' && isAbortError(result.reason)
  )

  if (abortedResult?.status === 'rejected') {
    throw abortedResult.reason
  }

  const failedSchemaResults = schemaSpecs.flatMap((result, index) =>
    result.status === 'rejected' ? [{ schema: schemas[index], reason: result.reason }] : []
  )

  if (failedSchemaResults.length === 1) {
    throw failedSchemaResults[0].reason
  }

  if (failedSchemaResults.length > 1) {
    const failedSchemas = failedSchemaResults.map(({ schema }) => schema)
    throw new Error(`Failed to fetch ${subject} for schemas: ${failedSchemas.join(', ')}`)
  }

  return schemaSpecs.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
}

export async function getProjectJsonSchemaForSchema<TData = ProjectJsonSchemaResponse>(
  { projectRef, schema }: { projectRef: string; schema: string },
  signal?: AbortSignal
) {
  const url = resolveDocsApiUrl(`/platform/projects/${projectRef}/api/rest`)
  url.searchParams.set('schema', schema)

  const headers = await constructHeaders()
  const response = await fetchHandler(url.toString(), { method: 'GET', headers, signal })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw handleError(body)
  }

  return response.json() as Promise<TData>
}

export async function getProjectJsonSchema(
  { projectRef, schemas }: ProjectJsonSchemaVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const targetSchemas = getTargetSchemas(schemas)
  const settledSchemaSpecs = await Promise.allSettled(
    targetSchemas.map(async (schema) => ({
      schema,
      data: await getProjectJsonSchemaForSchema({ projectRef, schema }, signal),
    }))
  )
  const schemaSpecs = getResolvedSchemaSpecs(settledSchemaSpecs, targetSchemas, 'JSON schema')

  return mergeSchemaResponses(schemaSpecs, targetSchemas)
}

export type ProjectJsonSchemaData = Awaited<ReturnType<typeof getProjectJsonSchema>>
export type ProjectJsonSchemaError = ResponseError

export const useProjectJsonSchemaQuery = <TData = ProjectJsonSchemaData>(
  { projectRef, schemas }: ProjectJsonSchemaVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ProjectJsonSchemaData, ProjectJsonSchemaError, TData> = {}
) =>
  useQuery<ProjectJsonSchemaData, ProjectJsonSchemaError, TData>({
    queryKey: docsKeys.jsonSchema(projectRef, schemas),
    queryFn: ({ signal }) => getProjectJsonSchema({ projectRef, schemas }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
