import { useQuery } from '@tanstack/react-query'

import { openApiKeys } from './keys'
import {
  getProjectJsonSchemaForSchema,
  getQualifiedEntityName,
  getQualifiedPath,
  getResolvedSchemaSpecs,
  getTargetSchemas,
  mergeSchemaResponses,
  type ProjectJsonSchemaResponse,
} from '@/data/docs/project-json-schema-query'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OpenAPISpecVariables = {
  projectRef?: string
  schemas?: string[]
}

export type OpenAPISpecResponse = {
  data: ProjectJsonSchemaResponse
  tables: any[]
  functions: any[]
}

export async function getOpenAPISpec(
  { projectRef, schemas }: OpenAPISpecVariables,
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
  const schemaSpecs = getResolvedSchemaSpecs(settledSchemaSpecs, targetSchemas, 'OpenAPI spec')

  const mergedData = mergeSchemaResponses(schemaSpecs, targetSchemas)

  const tables = schemaSpecs.flatMap(({ data, schema }) =>
    Object.entries<any>(data?.definitions ?? {}).map(([name, table]) => ({
      ...table,
      schema,
      name: getQualifiedEntityName(schema, name, targetSchemas),
      entityName: name,
      fields: Object.entries(table.properties || {}).map(([fieldName, field]: any) => ({
        ...field,
        name: fieldName,
      })),
    }))
  )

  const functions = schemaSpecs
    .flatMap(({ data, schema }) =>
      Object.entries<any>(data?.paths ?? {})
        .map(([path, value]) => {
          if (!path.startsWith('/rpc/')) return null

          const functionName = path.replace('/rpc/', '')
          return {
            ...value,
            schema,
            path: getQualifiedPath(schema, path, targetSchemas),
            name: getQualifiedEntityName(schema, functionName, targetSchemas),
            entityName: functionName,
          }
        })
        .filter((value): value is NonNullable<typeof value> => value !== null)
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  return { data: mergedData, tables, functions }
}

export type OpenAPISpecData = Awaited<OpenAPISpecResponse>
export type OpenAPISpecError = ResponseError

export const useOpenAPISpecQuery = <TData = OpenAPISpecData>(
  { projectRef, schemas }: OpenAPISpecVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OpenAPISpecData, OpenAPISpecError, TData> = {}
) =>
  useQuery<OpenAPISpecData, OpenAPISpecError, TData>({
    queryKey: openApiKeys.apiSpec(projectRef, schemas),
    queryFn: ({ signal }) => getOpenAPISpec({ projectRef, schemas }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
