import { useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { dependencyGraphKeys } from './keys'

export type DependencyGraphNodeType =
  | 'table'
  | 'view'
  | 'materialized_view'
  | 'function'
  | 'trigger'
  | 'policy'
  | 'index'
  | 'sequence'
  | 'type'

export type DependencyGraphEdgeType =
  | 'fk'
  | 'trigger_table'
  | 'trigger_function'
  | 'policy'
  | 'index'
  | 'view_dependency'
  | 'function_table'
  | 'sequence_owned'

export interface DependencyGraphNode {
  id: number
  name: string
  schema: string
  type: DependencyGraphNodeType
  comment: string | null
}

export interface DependencyGraphEdge {
  id: string
  source: number
  target: number
  type: DependencyGraphEdgeType
  label: string | null
}

export interface DependencyGraph {
  nodes: DependencyGraphNode[]
  edges: DependencyGraphEdge[]
}

export type DependencyGraphVariables = {
  projectRef?: string
  connectionString?: string | null
  includedSchemas?: string[]
  excludedSchemas?: string[]
  includedTypes?: DependencyGraphNodeType[]
}

export async function getDependencyGraph(
  { projectRef, connectionString, includedSchemas, excludedSchemas, includedTypes }: DependencyGraphVariables,
  signal?: AbortSignal
): Promise<DependencyGraph> {
  if (!projectRef) throw new Error('projectRef is required')

  const queryParams: Record<string, string> = {}
  if (includedSchemas?.length) {
    queryParams.included_schemas = includedSchemas.join(',')
  }
  if (excludedSchemas?.length) {
    queryParams.excluded_schemas = excludedSchemas.join(',')
  }
  if (includedTypes?.length) {
    queryParams.included_types = includedTypes.join(',')
  }

  const { data, error } = await get('/platform/pg-meta/{ref}/dependency-graph', {
    params: {
      header: { 'x-connection-encrypted': connectionString ?? '' },
      path: { ref: projectRef },
      query: queryParams as any,
    },
    signal,
  })

  if (error) handleError(error)

  return data as unknown as DependencyGraph
}

export type DependencyGraphData = Awaited<ReturnType<typeof getDependencyGraph>>
export type DependencyGraphError = ResponseError

export const useDependencyGraphQuery = <TData = DependencyGraphData>(
  { projectRef, connectionString, includedSchemas, excludedSchemas, includedTypes }: DependencyGraphVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<DependencyGraphData, DependencyGraphError, TData> = {}
) =>
  useQuery<DependencyGraphData, DependencyGraphError, TData>({
    queryKey: dependencyGraphKeys.graph(projectRef, includedSchemas, includedTypes),
    queryFn: ({ signal }) =>
      getDependencyGraph({ projectRef, connectionString, includedSchemas, excludedSchemas, includedTypes }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
