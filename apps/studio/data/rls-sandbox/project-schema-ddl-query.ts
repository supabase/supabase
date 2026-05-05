import { getEntityDefinitionsSql } from '@supabase/pg-meta'
import type { PostgresPolicy } from '@supabase/postgres-meta'
import { useQuery } from '@tanstack/react-query'

import { getDatabasePolicies } from '@/data/database-policies/database-policies-query'
import { executeSql } from '@/data/sql/execute-sql-query'
import { quoteLiteral } from '@/lib/pg-format'
import type { UseCustomQueryOptions } from '@/types'

export interface RlsTableStatus {
  schema: string
  table: string
  rls_enabled: boolean
  rls_forced: boolean
}

export interface CustomRole {
  name: string
}

export interface ProjectSchemaDDL {
  typeDefinitions: string[]
  entityDefinitions: string[]
  functionDefinitions: string[]
  policies: PostgresPolicy[]
  rlsStatuses: RlsTableStatus[]
  customRoles: CustomRole[]
}

const SYSTEM_ROLES = [
  'postgres',
  'anon',
  'authenticated',
  'service_role',
  'supabase_admin',
  'supabase_auth_admin',
  'supabase_storage_admin',
  'supabase_replication_admin',
  'supabase_read_only_user',
  'pg_monitor',
  'pg_read_all_settings',
  'pg_read_all_stats',
  'pg_stat_scan_tables',
  'pg_read_server_files',
  'pg_write_server_files',
  'pg_execute_server_program',
  'pg_signal_backend',
  'dashboard_user',
  'pgbouncer',
  'authenticator',
]

const CUSTOM_ROLES_SQL = `
  SELECT rolname AS name
  FROM pg_roles
  WHERE rolname NOT IN (${SYSTEM_ROLES.map(quoteLiteral).join(',')})
    AND rolname NOT LIKE 'pg_%'
    AND rolname NOT LIKE 'supabase_%'
  ORDER BY rolname
`

function toSqlList(schemas: string[]) {
  return schemas.map(quoteLiteral).join(', ')
}

function getTypeDefinitionsSql(schemas: string[]) {
  return `
    SELECT
      CASE t.typtype
        WHEN 'e' THEN
          'CREATE TYPE ' || quote_ident(n.nspname) || '.' || quote_ident(t.typname) ||
          ' AS ENUM (' ||
          (SELECT string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder)
           FROM pg_enum e WHERE e.enumtypid = t.oid) ||
          ')'
        WHEN 'c' THEN
          'CREATE TYPE ' || quote_ident(n.nspname) || '.' || quote_ident(t.typname) ||
          ' AS (' ||
          (SELECT string_agg(quote_ident(a.attname) || ' ' || pg_catalog.format_type(a.atttypid, a.atttypmod), ', ' ORDER BY a.attnum)
           FROM pg_attribute a WHERE a.attrelid = t.typrelid AND a.attnum > 0 AND NOT a.attisdropped) ||
          ')'
        WHEN 'd' THEN
          'CREATE DOMAIN ' || quote_ident(n.nspname) || '.' || quote_ident(t.typname) ||
          ' AS ' || pg_catalog.format_type(t.typbasetype, t.typtypmod)
      END AS definition
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    LEFT JOIN pg_class c ON c.oid = t.typrelid
    LEFT JOIN pg_depend d ON d.objid = t.oid AND d.deptype = 'e'
    WHERE n.nspname IN (${toSqlList(schemas)})
      AND t.typtype IN ('e', 'c', 'd')
      AND d.objid IS NULL
      AND (t.typtype != 'c' OR c.relkind = 'c')
    ORDER BY t.typtype, n.nspname, t.typname
  `
}

function getFunctionDefinitionsSql(schemas: string[]) {
  return `
    SELECT pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
    WHERE n.nspname IN (${toSqlList(schemas)})
      AND p.prokind = 'f'
      AND l.lanname IN ('sql', 'plpgsql')
      AND p.prorettype <> 'pg_catalog.trigger'::regtype
      AND d.objid IS NULL
    ORDER BY n.nspname, p.proname
  `
}

function getRlsStatusSql(schemas: string[]) {
  return `
    SELECT
      n.nspname AS schema,
      c.relname AS table,
      c.relrowsecurity AS rls_enabled,
      c.relforcerowsecurity AS rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relkind = 'r'
      AND n.nspname IN (${toSqlList(schemas)})
    ORDER BY n.nspname, c.relname
  `
}

type Variables = {
  projectRef?: string
  connectionString?: string | null
  schemas: string[]
}

async function getProjectSchemaDDL(
  { projectRef, connectionString, schemas }: Variables,
  signal?: AbortSignal
): Promise<ProjectSchemaDDL> {
  const entitySql = getEntityDefinitionsSql({ schemas })

  const [entityResult, policiesResult, rlsResult, rolesResult, functionsResult, typesResult] =
    await Promise.all([
      executeSql(
        { projectRef, connectionString, sql: entitySql, queryKey: ['rls-sandbox-ddl'] },
        signal
      ),
      getDatabasePolicies({ projectRef, connectionString }, signal),
      executeSql(
        {
          projectRef,
          connectionString,
          sql: getRlsStatusSql(schemas),
          queryKey: ['rls-sandbox-rls'],
        },
        signal
      ),
      executeSql(
        { projectRef, connectionString, sql: CUSTOM_ROLES_SQL, queryKey: ['rls-sandbox-roles'] },
        signal
      ),
      executeSql(
        {
          projectRef,
          connectionString,
          sql: getFunctionDefinitionsSql(schemas),
          queryKey: ['rls-sandbox-functions'],
        },
        signal
      ),
      executeSql(
        {
          projectRef,
          connectionString,
          sql: getTypeDefinitionsSql(schemas),
          queryKey: ['rls-sandbox-types'],
        },
        signal
      ),
    ])

  return {
    typeDefinitions: (typesResult.result as { definition: string }[]).map((r) => r.definition),
    entityDefinitions: (entityResult.result[0]?.data?.definitions ?? []).map(
      (d: { sql: string }) => d.sql
    ),
    functionDefinitions: (functionsResult.result as { definition: string }[]).map(
      (r) => r.definition
    ),
    policies: (policiesResult ?? []) as PostgresPolicy[],
    rlsStatuses: rlsResult.result as RlsTableStatus[],
    customRoles: rolesResult.result as CustomRole[],
  }
}

export type ProjectSchemaDDLData = Awaited<ReturnType<typeof getProjectSchemaDDL>>
export type ProjectSchemaDDLError = Error

export const useProjectSchemaDDLQuery = <TData = ProjectSchemaDDLData>(
  { projectRef, connectionString, schemas }: Variables,
  options: UseCustomQueryOptions<ProjectSchemaDDLData, ProjectSchemaDDLError, TData> = {}
) =>
  useQuery<ProjectSchemaDDLData, ProjectSchemaDDLError, TData>({
    queryKey: ['rls-sandbox', 'schema', projectRef, [...schemas].sort().join(',')],
    queryFn: ({ signal }) => getProjectSchemaDDL({ projectRef, connectionString, schemas }, signal),
    enabled: options.enabled !== false && !!projectRef && schemas.length > 0,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
