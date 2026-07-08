import pgMeta, {
  getEntityDefinitionsSql,
  joinSqlFragments,
  literal,
  safeSql,
  type PGPolicy,
} from '@supabase/pg-meta'
import { z } from 'zod'

import { executeSql } from '@/data/sql/execute-sql-mutation'
import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'

export interface RlsTableStatus {
  schema: string
  table: string
  rls_enabled: boolean
  rls_forced: boolean
}

export interface CustomRole {
  name: string
}

export interface DatabaseSchemaDDL {
  schemas: string[]
  typeDefinitions: string[]
  entityDefinitions: string[]
  functionDefinitions: string[]
  policies: PGPolicy[]
  rlsStatuses: RlsTableStatus[]
  customRoles: CustomRole[]
}

const pgMetaRolesList = pgMeta.roles.list()
const pgMetaFunctionsZod = pgMeta.functions.list().zod
const pgMetaPoliciesZod = pgMeta.policies.list().zod
const pgMetaTablesZod = pgMeta.tables.list().zod

// Extension-owned / platform-specific schemas whose DDL depends on C extensions,
// custom operators, and platform functions that PGlite cannot replicate.
// We skip entity/function/type DDL for these but still fetch their policies —
// those may reference user tables we do load.
const SUPABASE_INTERNAL_SCHEMAS = new Set([...INTERNAL_SCHEMAS, '_realtime'])

const SYSTEM_ROLES = new Set([
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
])

function getTypeDefinitionsSql(schemas: string[]) {
  return safeSql`
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
    WHERE n.nspname IN (${joinSqlFragments(schemas.map(literal), ', ')})
      AND t.typtype IN ('e', 'c', 'd')
      AND d.objid IS NULL
      AND (t.typtype != 'c' OR c.relkind = 'c')
    ORDER BY t.typtype, n.nspname, t.typname
  `
}

type Variables = {
  projectRef?: string
  connectionString?: string | null
  schemas: string[]
}

export async function getDatabaseSchemaDDL(
  { projectRef, connectionString, schemas }: Variables,
  signal?: AbortSignal
): Promise<DatabaseSchemaDDL> {
  const userSchemas = schemas.filter((s) => !SUPABASE_INTERNAL_SCHEMAS.has(s))

  const entitySql = getEntityDefinitionsSql({ schemas: userSchemas })
  const functionsSql = pgMeta.functions.list({ includedSchemas: userSchemas }).sql
  const policiesSql = pgMeta.policies.list({ includedSchemas: schemas }).sql
  const tablesSql = pgMeta.tables.list({ includedSchemas: userSchemas }).sql

  const [entityResult, policiesResult, rlsResult, rolesResult, functionsResult, typesResult] =
    await Promise.all([
      executeSql(
        { projectRef, connectionString, sql: entitySql, queryKey: ['rls-sandbox-ddl'] },
        signal
      ),
      executeSql(
        { projectRef, connectionString, sql: policiesSql, queryKey: ['rls-sandbox-policies'] },
        signal
      ),
      executeSql(
        { projectRef, connectionString, sql: tablesSql, queryKey: ['rls-sandbox-rls'] },
        signal
      ),
      executeSql(
        { projectRef, connectionString, sql: pgMetaRolesList.sql, queryKey: ['rls-sandbox-roles'] },
        signal
      ),
      executeSql(
        {
          projectRef,
          connectionString,
          sql: functionsSql,
          queryKey: ['rls-sandbox-functions'],
        },
        signal
      ),
      executeSql(
        {
          projectRef,
          connectionString,
          sql: getTypeDefinitionsSql(userSchemas),
          queryKey: ['rls-sandbox-types'],
        },
        signal
      ),
    ])

  const roles = (rolesResult.result as z.infer<typeof pgMetaRolesList.zod>).filter(
    (r) => !SYSTEM_ROLES.has(r.name) && !r.name.startsWith('pg_') && !r.name.startsWith('supabase_')
  )

  const functions = (functionsResult.result as z.infer<typeof pgMetaFunctionsZod>).filter(
    (f) => (f.language === 'sql' || f.language === 'plpgsql') && f.return_type !== 'trigger'
  )

  return {
    schemas: userSchemas,
    typeDefinitions: (typesResult.result as { definition: string }[]).map((r) => r.definition),
    entityDefinitions: (entityResult.result[0]?.data?.definitions ?? []).map(
      (d: { sql: string }) => d.sql
    ),
    functionDefinitions: functions.map((f) => f.complete_statement),
    policies: policiesResult.result as z.infer<typeof pgMetaPoliciesZod> as PGPolicy[],
    rlsStatuses: (rlsResult.result as z.infer<typeof pgMetaTablesZod>).map((t) => ({
      schema: t.schema,
      table: t.name,
      rls_enabled: t.rls_enabled,
      rls_forced: t.rls_forced,
    })),
    customRoles: roles,
  }
}

export type DatabaseSchemaDDLData = Awaited<ReturnType<typeof getDatabaseSchemaDDL>>
