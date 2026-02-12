import { unsafeEntitiesInApiSql } from '@/data/queries/sql/tables-without-rls'
import { executeSql } from '@/data/sql/execute-sql-query'

import type { EnableCheckAction, EnableCheckState } from './DataApiEnableSwitch.types'

export type ExposedEntity = {
  schema: string
  name: string
  type: 'table' | 'foreign table' | 'materialized view' | 'view'
}

/**
 * Queries for entities that would be exposed through the Data API with
 * potential security issues: tables without RLS, foreign tables, materialized
 * views, and views without SECURITY INVOKER.
 *
 * This checks against the _target_ schemas rather than the currently active
 * PostgREST config, so it works correctly when enabling the Data API.
 */
export async function queryUnsafeEntitiesInApi({
  projectRef,
  connectionString,
  schemas,
}: {
  projectRef: string
  connectionString?: string | null
  schemas: Array<string>
}): Promise<Array<ExposedEntity>> {
  if (schemas.length === 0) return []

  const { result } = await executeSql<Array<ExposedEntity>>({
    projectRef,
    connectionString,
    sql: unsafeEntitiesInApiSql(schemas),
    queryKey: ['unsafe-entities-in-api'],
  })

  return result ?? []
}

export const getDefaultSchemas = (dbSchema: string | null | undefined) => {
  const schemas =
    dbSchema
      ?.split(',')
      .map((schema) => schema.trim())
      .filter((schema) => schema.length > 0) ?? []

  return schemas.length > 0 ? schemas : ['public']
}

export function enableCheckReducer(
  state: EnableCheckState,
  action: EnableCheckAction
): EnableCheckState {
  switch (state.status) {
    case 'idle':
      if (action.type === 'START_CHECK') return { status: 'checking' }
      return state
    case 'checking':
      if (action.type === 'ENTITIES_FOUND')
        return { status: 'confirming', unsafeEntities: action.unsafeEntities }
      if (action.type === 'DISMISS') return { status: 'idle' }
      return state
    case 'confirming':
      if (action.type === 'DISMISS') return { status: 'idle' }
      return state
  }
}
