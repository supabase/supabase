/**
 * TEMPORARY. Delete once Spark (turso) runs `roles.list`, which fails there on `pg_stat_activity`.
 *
 * Active connections read as 0 (Spark has no `pg_stat_activity`). A role without a connection limit keeps
 * its `-1` when the server does not report `max_connections`.
 */
import { toBool, toInt, toText, type CatalogQuery } from '../catalog-fallback'
import { safeSql } from '../pg-format'

/** Fallback for `roles.list`. */
export async function listRolesFallback(
  query: CatalogQuery,
  {
    includeDefaultRoles = false,
    limit,
    offset = 0,
  }: { includeDefaultRoles?: boolean; limit?: number; offset?: number } = {}
) {
  const rows = await query(safeSql`
      select r.oid::int8 as id, r.rolname as name, r.rolsuper, r.rolcreatedb, r.rolcreaterole,
        r.rolinherit, r.rolcanlogin, r.rolreplication, r.rolbypassrls, r.rolconnlimit,
        current_setting('max_connections', true) as max_connections,
        r.rolvaliduntil as valid_until, r.rolconfig as config
      from pg_catalog.pg_roles r`)
  const roles = rows
    .map((row) => {
      const limitValue = toInt(row.rolconnlimit)
      const config = Array.isArray(row.config) ? row.config.map(String) : []
      return {
        id: toInt(row.id),
        name: String(row.name),
        isSuperuser: toBool(row.rolsuper),
        canCreateDb: toBool(row.rolcreatedb),
        canCreateRole: toBool(row.rolcreaterole),
        inheritRole: toBool(row.rolinherit),
        canLogin: toBool(row.rolcanlogin),
        isReplicationRole: toBool(row.rolreplication),
        canBypassRls: toBool(row.rolbypassrls),
        // TEMPORARY: Spark has no pg_stat_activity; read the counts again once it does.
        activeConnections: 0,
        connectionLimit:
          limitValue === -1 && row.max_connections != null
            ? Number(row.max_connections)
            : limitValue,
        validUntil: toText(row.valid_until),
        config: Object.fromEntries(
          config.map((entry) => {
            const [param, value] = entry.split('=')
            return [param, value]
          })
        ),
      }
    })
    .filter(({ name }) => includeDefaultRoles || !name.startsWith('pg_'))
  return roles.slice(offset, limit ? offset + limit : undefined)
}
