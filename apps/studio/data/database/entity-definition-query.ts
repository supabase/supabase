import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { SupportedAssistantEntities } from 'components/ui/AIAssistantPanel/AIAssistant.types'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'

const generatePolicyDefinition = (policy: {
  command: string
  name: string
  permissive: string
  roles: string
  schema: string
  table: string
  qual: string | null
  with_check: string | null
}) => {
  const roles = policy.roles.replace('{', '').replace('}', '').split(',')

  return `
CREATE POLICY "${policy.name}" on "${policy.schema}"."${policy.table}" AS ${policy.permissive} FOR ${policy.command} TO ${roles.join(', ')} ${policy.qual ? `USING (${policy.qual})` : ''} ${policy.with_check ? `WITH CHECK (${policy.with_check})` : ''};`.trim()
}

// [Joshen] Eventually should support table definition and view definition as well if possible
export const getEntityDefinitionSql = ({
  id,
  type,
}: {
  id?: number
  type?: SupportedAssistantEntities | 'table' | 'view' | null
}) => {
  if (!id) {
    throw new Error('id is required')
  }
  if (!type) {
    throw new Error('type is required')
  }

  switch (type) {
    case 'functions':
      return /* SQL */ `
      select pg_get_functiondef(${id})
    `.trim()
    case 'rls-policies':
      return /* SQL */ `
      SELECT 
        n.nspname AS schema,
        c.relname AS table,
        pol.polname AS name,
            CASE
                WHEN pol.polpermissive THEN 'PERMISSIVE'::text
                ELSE 'RESTRICTIVE'::text
            END AS permissive,
            CASE
                WHEN pol.polroles = '{0}'::oid[] THEN string_to_array('public'::text, ''::text)::name[]
                ELSE ARRAY( SELECT pg_authid.rolname
                  FROM pg_authid
                  WHERE pg_authid.oid = ANY (pol.polroles)
                  ORDER BY pg_authid.rolname)
            END AS roles,
            CASE pol.polcmd
                WHEN 'r'::"char" THEN 'SELECT'::text
                WHEN 'a'::"char" THEN 'INSERT'::text
                WHEN 'w'::"char" THEN 'UPDATE'::text
                WHEN 'd'::"char" THEN 'DELETE'::text
                WHEN '*'::"char" THEN 'ALL'::text
                ELSE NULL::text
            END AS command,
        pg_get_expr(pol.polqual, pol.polrelid) AS qual,
        pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
      FROM pg_policy pol
        JOIN pg_class c ON c.oid = pol.polrelid
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE pol.oid = ${id};
    `.trim()
  }

  return ''
}

export type EntityDefinitionVariables = {
  id?: number
  type?: SupportedAssistantEntities | null
  projectRef?: string
  connectionString?: string
}

export async function getEntityDefinition(
  { projectRef, connectionString, id, type }: EntityDefinitionVariables,
  signal?: AbortSignal
) {
  if (!id) {
    throw new Error('id is required')
  }

  const sql = getEntityDefinitionSql({ id, type })
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['entity-definition', id],
    },
    signal
  )

  if (type === 'functions') {
    return result[0].pg_get_functiondef
  } else if (type === 'rls-policies') {
    return generatePolicyDefinition(result[0])
  } else {
    return result[0]
  }
}

export type EntityDefinitionData = string
export type EntityDefinitionError = ExecuteSqlError

export const useEntityDefinitionQuery = <TData = EntityDefinitionData>(
  { projectRef, connectionString, id, type }: EntityDefinitionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<EntityDefinitionData, EntityDefinitionError, TData> = {}
) =>
  useQuery<EntityDefinitionData, EntityDefinitionError, TData>(
    databaseKeys.entityDefinition(projectRef, id),
    ({ signal }) => getEntityDefinition({ projectRef, connectionString, id, type }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof id !== 'undefined' &&
        !isNaN(id) &&
        typeof type !== 'undefined',
      ...options,
    }
  )
