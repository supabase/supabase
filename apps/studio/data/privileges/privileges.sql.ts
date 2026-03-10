import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'

export const IGNORED_SCHEMAS = [...INTERNAL_SCHEMAS, 'pg_catalog']

const IGNORED_SCHEMAS_LIST = IGNORED_SCHEMAS.map((s) => `'${s}'`).join(', ')

/**
 * Builds the shared `table_privileges` and `table_grants` CTEs used by
 * both the exposed-tables list query and the counts-only query.
 *
 * Returns SQL text meant to follow `WITH` (no leading `WITH` keyword).
 * Callers that append additional CTEs should add a comma after interpolation.
 */
function getTableGrantsCTEs({ search }: { search?: string } = {}) {
  return /* SQL */ `
    table_privileges as (
      select
        c.oid::int as id,
        n.nspname as schema_name,
        c.relname as name,
        c.relkind as kind,

        -- Anon Privileges
        bool_or(pr.rolname = 'anon' and acl.privilege_type = 'SELECT') as anon_select,
        bool_or(pr.rolname = 'anon' and acl.privilege_type = 'INSERT') as anon_insert,
        bool_or(pr.rolname = 'anon' and acl.privilege_type = 'UPDATE') as anon_update,
        bool_or(pr.rolname = 'anon' and acl.privilege_type = 'DELETE') as anon_delete,

        -- Authenticated Privileges
        bool_or(pr.rolname = 'authenticated' and acl.privilege_type = 'SELECT') as auth_select,
        bool_or(pr.rolname = 'authenticated' and acl.privilege_type = 'INSERT') as auth_insert,
        bool_or(pr.rolname = 'authenticated' and acl.privilege_type = 'UPDATE') as auth_update,
        bool_or(pr.rolname = 'authenticated' and acl.privilege_type = 'DELETE') as auth_delete,

        -- Service Role Privileges
        bool_or(pr.rolname = 'service_role' and acl.privilege_type = 'SELECT') as srv_select,
        bool_or(pr.rolname = 'service_role' and acl.privilege_type = 'INSERT') as srv_insert,
        bool_or(pr.rolname = 'service_role' and acl.privilege_type = 'UPDATE') as srv_update,
        bool_or(pr.rolname = 'service_role' and acl.privilege_type = 'DELETE') as srv_delete

      from pg_class c
      join pg_namespace n
        on n.oid = c.relnamespace
      left join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) as acl
        on true
      left join pg_roles pr
        on pr.oid = acl.grantee
      where c.relkind in ('r', 'p', 'v', 'm', 'f')
        and n.nspname not in (${IGNORED_SCHEMAS_LIST})
        ${search ? `and (n.nspname || '.' || c.relname) ilike '%${search}%'` : ''}
      group by c.oid, n.nspname, c.relname, c.relkind
    ),
    table_grants as (
      select
        id,
        schema_name,
        name,
        kind,
        case
          -- 1. Strict Granted: All 3 roles possess ALL 4 privileges
          when (
            anon_select and anon_insert and anon_update and anon_delete and
            auth_select and auth_insert and auth_update and auth_delete and
            srv_select and srv_insert and srv_update and srv_delete
          ) then 'granted'

          -- 2. Strict Revoked: NO role possesses ANY privilege
          when not (
            anon_select or anon_insert or anon_update or anon_delete or
            auth_select or auth_insert or auth_update or auth_delete or
            srv_select or srv_insert or srv_update or srv_delete
          ) then 'revoked'

          -- 3. Custom: Anything in between
          else 'custom'
        end as status
      from table_privileges
    )
  `
}

export function getExposedTablesSql({
  search,
  offset,
  limit,
}: {
  search?: string
  offset: number
  limit: number
}) {
  return /* SQL */ `
    with ${getTableGrantsCTEs({ search })}
    select
      (select count(*)::int from table_grants) as total_count,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', tg.id,
              'schema', tg.schema_name,
              'name', tg.name,
              'status', tg.status
            )
          )
          from (
            select *
            from table_grants
            order by schema_name, name
            offset ${offset}
            limit ${limit}
          ) tg
        ),
        '[]'::jsonb
      ) as tables;
  `
}

export function getExposedTableCountsSql({ selectedSchemas }: { selectedSchemas: string[] }) {
  const schemasList =
    selectedSchemas.length > 0 ? selectedSchemas.map((s) => `'${s}'`).join(', ') : "''"

  return /* SQL */ `
    with ${getTableGrantsCTEs()}
 select
      count(*)::int as total_count,
      (count(*) filter (where status = 'granted' and schema_name in (${schemasList})))::int as grants_count
  from table_grants
  `
}

export function getExposedSchemasSql() {
  return /* SQL */ `
    select coalesce(
      (
        select jsonb_agg(distinct schema_name order by schema_name)
        from (
          select n.nspname as schema_name
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
          left join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) as acl on true
          where c.relkind in ('r', 'p', 'v', 'm', 'f')
            and n.nspname not in (${IGNORED_SCHEMAS_LIST})
          group by c.oid, n.nspname
          having
            bool_or(
              pg_catalog.pg_get_userbyid(acl.grantee) = 'anon'
              and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
            )
            and bool_or(
              pg_catalog.pg_get_userbyid(acl.grantee) = 'authenticated'
              and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
            )
            and bool_or(
              pg_catalog.pg_get_userbyid(acl.grantee) = 'service_role'
              and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
            )
        ) t
      ),
      '[]'::jsonb
    ) as schemas;
  `
}
