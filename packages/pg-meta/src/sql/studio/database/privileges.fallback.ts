/**
 * TEMPORARY. Delete once Spark (turso) has `aclexplode`, which the Data API privilege queries need.
 *
 * Reads the ACLs as text and explodes them in TypeScript (`acl.fallback.ts`).
 */
import { toInt, type CatalogQuery } from '../../../catalog-fallback'
import { joinSqlFragments, literal, safeSql, type SafeSqlFragment } from '../../../pg-format'
import { explodeAcl } from '../../acl.fallback'

const API_ROLES = ['anon', 'authenticated', 'service_role']
const TABLE_PRIVILEGES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']

type Status = 'granted' | 'revoked' | 'custom'

const explode = (acl: unknown) => explodeAcl(acl == null ? null : String(acl))

function grantStatus(acls: unknown[], privileges: string[]): Status {
  const held = new Set(acls.flatMap(explode).map((p) => `${p.grantee}:${p.privilege_type}`))
  const wanted = API_ROLES.flatMap((role) => privileges.map((privilege) => `${role}:${privilege}`))
  if (wanted.every((key) => held.has(key))) return 'granted'
  if (!wanted.some((key) => held.has(key))) return 'revoked'
  return 'custom'
}

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

const schemaClauses = (column: SafeSqlFragment, ignoredSchemas: string[], search?: string) =>
  safeSql`${
    ignoredSchemas.length > 0
      ? safeSql`and ${column} not in (${joinSqlFragments(ignoredSchemas.map(literal), ', ')})`
      : safeSql``
  } ${search ? safeSql`and (${column} || '.' || name) ilike ${literal(`%${search}%`)}` : safeSql``}`

async function tableGrants(
  query: CatalogQuery,
  { search, ignoredSchemas = [] }: { search?: string; ignoredSchemas?: string[] }
) {
  const rows = await query(safeSql`
    select * from (
      select c.oid::int8 as id, n.nspname as schema_name, c.relname as name,
        coalesce(c.relacl, acldefault('r', c.relowner))::text as acl
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where c.relkind in ('r', 'p', 'v', 'm', 'f')
    ) relations
    where true ${schemaClauses(safeSql`schema_name`, ignoredSchemas, search)}`)
  return rows
    .map((row) => ({
      id: toInt(row.id),
      schema: String(row.schema_name),
      name: String(row.name),
      status: grantStatus([row.acl], TABLE_PRIVILEGES),
    }))
    .sort((a, b) => compareText(a.schema, b.schema) || compareText(a.name, b.name))
}

async function functionGrants(
  query: CatalogQuery,
  { search, ignoredSchemas = [] }: { search?: string; ignoredSchemas?: string[] }
) {
  const rows = await query(safeSql`
    select * from (
      select n.nspname as schema_name, p.proname as name,
        coalesce(p.proacl, acldefault('f', p.proowner))::text as acl
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      where p.prokind in ('f', 'w')
    ) routines
    where true ${schemaClauses(safeSql`schema_name`, ignoredSchemas, search)}`)
  // Overloads share one status: a role has EXECUTE when any overload grants it.
  const byName = new Map<string, { schema: string; name: string; acls: unknown[] }>()
  for (const row of rows) {
    const key = `${String(row.schema_name)}.${String(row.name)}`
    const entry = byName.get(key) ?? {
      schema: String(row.schema_name),
      name: String(row.name),
      acls: [],
    }
    entry.acls.push(row.acl)
    byName.set(key, entry)
  }
  return [...byName.values()]
    .map(({ schema, name, acls }) => ({ schema, name, status: grantStatus(acls, ['EXECUTE']) }))
    .sort((a, b) => compareText(a.schema, b.schema) || compareText(a.name, b.name))
}

/** Fallback for `getExposedTablesSql`. */
export async function getExposedTablesFallback(
  query: CatalogQuery,
  args: { search?: string; offset: number; limit: number; ignoredSchemas?: string[] }
) {
  const grants = await tableGrants(query, args)
  return [
    {
      total_count: grants.length,
      tables: grants.slice(args.offset, args.offset + args.limit),
    },
  ]
}

/** Fallback for `getExposedTableCountsSql`. */
export async function getExposedTableCountsFallback(
  query: CatalogQuery,
  { selectedSchemas, ignoredSchemas }: { selectedSchemas: string[]; ignoredSchemas?: string[] }
) {
  const grants = await tableGrants(query, { ignoredSchemas })
  return [
    {
      total_count: grants.length,
      grants_count: grants.filter(
        (grant) => grant.status === 'granted' && selectedSchemas.includes(grant.schema)
      ).length,
    },
  ]
}

/** Fallback for `getExposedFunctionsSql`. */
export async function getExposedFunctionsFallback(
  query: CatalogQuery,
  args: { search?: string; offset: number; limit: number; ignoredSchemas?: string[] }
) {
  const grants = await functionGrants(query, args)
  return [
    {
      total_count: grants.length,
      functions: grants.slice(args.offset, args.offset + args.limit),
    },
  ]
}

/** Fallback for `getExposedFunctionCountsSql`. */
export async function getExposedFunctionCountsFallback(
  query: CatalogQuery,
  { selectedSchemas, ignoredSchemas }: { selectedSchemas: string[]; ignoredSchemas?: string[] }
) {
  const grants = await functionGrants(query, { ignoredSchemas })
  return [
    {
      total_count: grants.length,
      grants_count: grants.filter(
        (grant) => grant.status === 'granted' && selectedSchemas.includes(grant.schema)
      ).length,
    },
  ]
}

/** Fallback for `getDefaultPrivilegesStateSql`. */
export async function getDefaultPrivilegesStateFallback(
  query: CatalogQuery,
  { schema = 'public' }: { schema?: string } = {}
) {
  const rows = await query(safeSql`
    select d.defaclacl::text as acl
    from pg_catalog.pg_default_acl d
    join pg_catalog.pg_namespace n on n.oid = d.defaclnamespace
    join pg_catalog.pg_roles r on r.oid = d.defaclrole
    where n.nspname = ${literal(schema)}
      and r.rolname = 'postgres'
      and d.defaclobjtype in ('r', 'f', 'S')`)
  return [
    {
      grant_count: rows.filter((row) => explode(row.acl).some((p) => API_ROLES.includes(p.grantee)))
        .length,
    },
  ]
}
