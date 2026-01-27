import { z } from 'zod'

import { ident, literal } from './pg-format'
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

function list({
  includeDefaultRoles: includeDefaultRoles = false,
  limit,
  offset,
}: {
  includeDefaultRoles?: boolean
  limit?: number
  offset?: number
} = {}): {
  sql: string
  zod: typeof pgRoleArrayZod
} {
  let sql = `
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
    sql += ` and not pg_catalog.starts_with(name, 'pg_')`
  }
  if (limit) {
    sql += ` limit ${limit}`
  }
  if (offset) {
    sql += ` offset ${offset}`
  }
  return {
    sql,
    zod: pgRoleArrayZod,
  }
}

type RoleIdentifier = Pick<PGRole, 'id'> | Pick<PGRole, 'name'>

function getIdentifierWhereClause(identifier: RoleIdentifier) {
  if ('id' in identifier && identifier.id) {
    return `${ident('id')} = ${literal(identifier.id)}`
  } else if ('name' in identifier && identifier.name) {
    return `${ident('name')} = ${literal(identifier.name)}`
  }
  throw new Error('Must provide either id or name')
}

function retrieve(identifier: RoleIdentifier): {
  sql: string
  zod: typeof pgRoleOptionalZod
} {
  const sql = `with roles as (${ROLES_SQL}) select * from roles where ${getIdentifierWhereClause(identifier)};`
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
  memberOf?: string[]
  members?: string[]
  admins?: string[]
  config?: Record<string, string>
}
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
}: RoleCreateParams): { sql: string } {
  const sql = `
create role ${ident(name)}
  ${isSuperuser ? 'superuser' : ''}
  ${canCreateDb ? 'createdb' : ''}
  ${canCreateRole ? 'createrole' : ''}
  ${inheritRole ? '' : 'noinherit'}
  ${canLogin ? 'login' : ''}
  ${isReplicationRole ? 'replication' : ''}
  ${canBypassRls ? 'bypassrls' : ''}
  connection limit ${connectionLimit}
  ${password === undefined ? '' : `password ${literal(password)}`}
  ${validUntil === undefined ? '' : `valid until ${literal(validUntil)}`}
  ${memberOf.length === 0 ? '' : `in role ${memberOf.map(ident).join(',')}`}
  ${members.length === 0 ? '' : `role ${members.map(ident).join(',')}`}
  ${admins.length === 0 ? '' : `admin ${admins.map(ident).join(',')}`}
  ;
${Object.entries(config)
  .map(([param, value]) => `alter role ${ident(name)} set ${ident(param)} = ${literal(value)};`)
  .join('\n')}
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
function update(identifier: RoleIdentifier, params: RoleUpdateParams): { sql: string } {
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
  const sql = `
do $$
declare
  old record;
begin
  with roles as (${ROLES_SQL})
  select * into old from roles where ${getIdentifierWhereClause(identifier)};
  if old is null then
    raise exception 'Cannot find role with id %', id;
  end if;

  execute(format('alter role %I
    ${isSuperuser === undefined ? '' : isSuperuser ? 'superuser' : 'nosuperuser'}
    ${canCreateDb === undefined ? '' : canCreateDb ? 'createdb' : 'nocreatedb'}
    ${canCreateRole === undefined ? '' : canCreateRole ? 'createrole' : 'nocreaterole'}
    ${inheritRole === undefined ? '' : inheritRole ? 'inherit' : 'noinherit'}
    ${canLogin === undefined ? '' : canLogin ? 'login' : 'nologin'}
    ${isReplicationRole === undefined ? '' : isReplicationRole ? 'replication' : 'noreplication'}
    ${canBypassRls === undefined ? '' : canBypassRls ? 'bypassrls' : 'nobypassrls'}
    ${connectionLimit === undefined ? '' : `connection limit ${connectionLimit}`}
    ${password === undefined ? '' : `password ${literal(password)}`}
    ${validUntil === undefined ? '' : `valid until %L`}
  ', old.name${validUntil === undefined ? '' : `, ${literal(validUntil)}`}));

  ${
    newName === undefined
      ? ''
      : `
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
function remove(
  identifier: RoleIdentifier,
  { ifExists = false }: RoleRemoveParams = {}
): { sql: string } {
  const sql = `
do $$
declare
  old record;
begin
  with roles as (${ROLES_SQL})
  select * into old from roles where ${getIdentifierWhereClause(identifier)};
  if old is null then
    raise exception 'Cannot find role with id %', id;
  end if;

  execute(format('drop role ${ifExists ? 'if exists' : ''} %I;', old.name));
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
