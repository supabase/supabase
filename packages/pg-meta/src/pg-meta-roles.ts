import { z } from 'zod'

import { ident, joinSqlFragments, literal, safeSql, type SafeSqlFragment } from './pg-format'
import { ROLES_SQL } from './sql/roles'

const pgRoleZod = z.object({
  id: z.number(),
  name: z.string(),
  isSuperuser: z.boolean(),
  canCreateDb: z.boolean(),
  canCreateRole: z.boolean(),
  inheritRole: z.boolean(),
  canLogin: z.boolean(),
  isReplicationRole: z.boolean(),
  canBypassRls: z.boolean(),
  activeConnections: z.number(),
  connectionLimit: z.number(),
  validUntil: z.union([z.string(), z.null()]),
  config: z.record(z.string(), z.string()),
})
const pgRoleArrayZod = z.array(pgRoleZod)
const pgRoleOptionalZod = z.optional(pgRoleZod)

export type PGRole = z.infer<typeof pgRoleZod>

/**
 * Lists all Postgres roles.
 *
 * @param options - Options to filter and paginate the role list.
 * @param options.includeDefaultRoles - Whether to include default/predefined Postgres roles (e.g., those starting with `pg_`).
 * @param options.limit - The maximum number of roles to return.
 * @param options.offset - The number of roles to skip.
 * @returns An object containing the generated safe SQL fragment and the zod validator.
 */
function list({
  includeDefaultRoles: includeDefaultRoles = false,
  limit,
  offset,
}: {
  includeDefaultRoles?: boolean
  limit?: number
  offset?: number
} = {}): {
  sql: SafeSqlFragment
  zod: typeof pgRoleArrayZod
} {
  let sql = safeSql`
with
  roles as (${ROLES_SQL})
select
  *
from
  roles
where
  true
`
  if (!includeDefaultRoles) {
    // All default/predefined roles start with pg_: https://www.postgresql.org/docs/15/predefined-roles.html
    // The pg_ prefix is also reserved:
    //
    // ```
    // postgres=# create role pg_myrole;
    // ERROR:  role name "pg_myrole" is reserved
    // DETAIL:  Role names starting with "pg_" are reserved.
    // ```
    sql = safeSql`${sql} and not pg_catalog.starts_with(name, 'pg_')`
  }
  if (limit) {
    sql = safeSql`${sql} limit ${literal(limit)}`
  }
  if (offset) {
    sql = safeSql`${sql} offset ${literal(offset)}`
  }
  return {
    sql,
    zod: pgRoleArrayZod,
  }
}

type RoleIdentifier = Pick<PGRole, 'id'> | Pick<PGRole, 'name'>

/**
 * Generates the SQL WHERE clause to identify a role by either its OID (id) or name.
 *
 * @param identifier - The identifier object containing the role's id or name.
 * @returns The SQL fragment containing the comparison.
 */
function getIdentifierWhereClause(identifier: RoleIdentifier): SafeSqlFragment {
  if ('id' in identifier && identifier.id) {
    return safeSql`${ident('id')} = ${literal(identifier.id)}`
  } else if ('name' in identifier && identifier.name) {
    return safeSql`${ident('name')} = ${literal(identifier.name)}`
  }
  throw new Error('Must provide either id or name')
}

/**
 * Retrieves a single Postgres role by its identifier (id or name).
 *
 * @param identifier - The unique identifier of the role (either id or name).
 * @returns An object containing the generated safe SQL fragment and the zod validator.
 */
function retrieve(identifier: RoleIdentifier): {
  sql: SafeSqlFragment
  zod: typeof pgRoleOptionalZod
} {
  const sql = safeSql`with roles as (${ROLES_SQL}) select * from roles where ${getIdentifierWhereClause(identifier)};`
  return {
    sql,
    zod: pgRoleOptionalZod,
  }
}

type RoleCreateParams = {
  name: string
  isSuperuser?: boolean
  canCreateDb?: boolean
  canCreateRole?: boolean
  inheritRole?: boolean
  canLogin?: boolean
  isReplicationRole?: boolean
  canBypassRls?: boolean
  connectionLimit?: number
  password?: string
  validUntil?: string
  memberOf?: Array<string>
  members?: Array<string>
  admins?: Array<string>
  config?: Record<string, string>
}

/**
 * Generates SQL to create a new Postgres role.
 *
 * @param params - Configuration options for creating the role.
 * @returns An object containing the generated safe SQL fragment.
 */
function create({
  name,
  isSuperuser = false,
  canCreateDb = false,
  canCreateRole = false,
  inheritRole = true,
  canLogin = false,
  isReplicationRole = false,
  canBypassRls = false,
  connectionLimit = -1,
  password,
  validUntil,
  memberOf = [],
  members = [],
  admins = [],
  config = {},
}: RoleCreateParams): { sql: SafeSqlFragment } {
  const sql = safeSql`
create role ${ident(name)}
  ${isSuperuser ? safeSql`superuser` : safeSql``}
  ${canCreateDb ? safeSql`createdb` : safeSql``}
  ${canCreateRole ? safeSql`createrole` : safeSql``}
  ${inheritRole ? safeSql`` : safeSql`noinherit`}
  ${canLogin ? safeSql`login` : safeSql``}
  ${isReplicationRole ? safeSql`replication` : safeSql``}
  ${canBypassRls ? safeSql`bypassrls` : safeSql``}
  connection limit ${literal(connectionLimit)}
  ${password === undefined ? safeSql`` : safeSql`password ${literal(password)}`}
  ${validUntil === undefined ? safeSql`` : safeSql`valid until ${literal(validUntil)}`}
  ${memberOf.length === 0 ? safeSql`` : safeSql`in role ${joinSqlFragments(memberOf.map(ident), ',')}`}
  ${members.length === 0 ? safeSql`` : safeSql`role ${joinSqlFragments(members.map(ident), ',')}`}
  ${admins.length === 0 ? safeSql`` : safeSql`admin ${joinSqlFragments(admins.map(ident), ',')}`}
  ;
${joinSqlFragments(
  Object.entries(config).map(
    ([param, value]) => safeSql`alter role ${ident(name)} set ${ident(param)} = ${literal(value)};`
  ),
  '\n'
)}
`
  return { sql }
}

type RoleUpdateParams = {
  name?: string
  isSuperuser?: boolean
  canCreateDb?: boolean
  canCreateRole?: boolean
  inheritRole?: boolean
  canLogin?: boolean
  isReplicationRole?: boolean
  canBypassRls?: boolean
  connectionLimit?: number
  password?: string
  validUntil?: string
}

/**
 * Generates SQL to update an existing Postgres role.
 *
 * @param identifier - The unique identifier of the role to update.
 * @param params - Configuration options to alter on the role.
 * @returns An object containing the generated safe SQL fragment.
 */
function update(identifier: RoleIdentifier, params: RoleUpdateParams): { sql: SafeSqlFragment } {
  const {
    name: newName,
    isSuperuser,
    canCreateDb,
    canCreateRole,
    inheritRole,
    canLogin,
    isReplicationRole,
    canBypassRls,
    connectionLimit,
    password,
    validUntil,
  } = params
  const searchVal = 'id' in identifier ? String((identifier as any).id) : (identifier as any).name
  const sql = safeSql`
do $$
declare
  search_val text := ${literal(searchVal)};
  old record;
begin
  with roles as (${ROLES_SQL})
  select * into old from roles where ${getIdentifierWhereClause(identifier)};
  if old is null then
    raise exception 'Cannot find role %', search_val;
  end if;

  execute(format('alter role %I
    ${isSuperuser === undefined ? safeSql`` : isSuperuser ? safeSql`superuser` : safeSql`nosuperuser`}
    ${canCreateDb === undefined ? safeSql`` : canCreateDb ? safeSql`createdb` : safeSql`nocreatedb`}
    ${canCreateRole === undefined ? safeSql`` : canCreateRole ? safeSql`createrole` : safeSql`nocreaterole`}
    ${inheritRole === undefined ? safeSql`` : inheritRole ? safeSql`inherit` : safeSql`noinherit`}
    ${canLogin === undefined ? safeSql`` : canLogin ? safeSql`login` : safeSql`nologin`}
    ${isReplicationRole === undefined ? safeSql`` : isReplicationRole ? safeSql`replication` : safeSql`noreplication`}
    ${canBypassRls === undefined ? safeSql`` : canBypassRls ? safeSql`bypassrls` : safeSql`nobypassrls`}
    ${connectionLimit === undefined ? safeSql`` : safeSql`connection limit ${literal(connectionLimit)}`}
    ${password === undefined ? safeSql`` : safeSql`password ${literal(password)}`}
    ${validUntil === undefined ? safeSql`` : safeSql`valid until %L`}
  ', old.name${validUntil === undefined ? safeSql`` : safeSql`, ${literal(validUntil)}`}));

  ${
    newName === undefined
      ? safeSql``
      : safeSql`
  -- Using the same name in the rename clause gives an error, so only do it if the new name is different.
  if ${literal(newName)} != old.name then
    execute(format('alter role %I rename to %I;', old.name, ${literal(newName)}));
  end if;
  `
  }
end
$$;
`
  return { sql }
}

type RoleRemoveParams = {
  ifExists?: boolean
}

/**
 * Generates SQL to drop an existing Postgres role.
 *
 * @param identifier - The unique identifier of the role to drop.
 * @param options - Configuration options for dropping the role.
 * @param options.ifExists - If true, skips dropping or raising an error if the role does not exist.
 * @returns An object containing the generated safe SQL fragment.
 */
function remove(
  identifier: RoleIdentifier,
  { ifExists = false }: RoleRemoveParams = {}
): { sql: SafeSqlFragment } {
  const searchVal = 'id' in identifier ? String((identifier as any).id) : (identifier as any).name
  const sql = safeSql`
do $$
declare
  search_val text := ${literal(searchVal)};
  old record;
begin
  with roles as (${ROLES_SQL})
  select * into old from roles where ${getIdentifierWhereClause(identifier)};
  if old is null then
    ${ifExists ? safeSql`null;` : safeSql`raise exception 'Cannot find role %', search_val;`}
  else
    execute(format('drop role if exists %I;', old.name));
  end if;
end
$$;
`
  return { sql }
}

export default {
  list,
  retrieve,
  create,
  update,
  remove,
  zod: pgRoleZod,
}
