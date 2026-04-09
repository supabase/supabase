/**
 * Builds the shared `table_privileges` and `table_grants` CTEs used by
 * both the exposed-tables list query and the counts-only query.
 *
 * Returns SQL text meant to follow `WITH` (no leading `WITH` keyword).
 * Callers that append additional CTEs should add a comma after interpolation.
 */
function getTableGrantsCTEs({
  search,
  ignoredSchemas = [],
}: { search?: string; ignoredSchemas?: string[] } = {}) {
  const IGNORED_SCHEMAS_LIST = ignoredSchemas.map((s) => `'${s}'`).join(', ')

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
        ${IGNORED_SCHEMAS_LIST ? `and n.nspname not in (${IGNORED_SCHEMAS_LIST})` : ''}
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
  ignoredSchemas = [],
}: {
  search?: string
  offset: number
  limit: number
  ignoredSchemas?: string[]
}) {
  return /* SQL */ `
    with ${getTableGrantsCTEs({ search, ignoredSchemas })}
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

export function getExposedTableCountsSql({
  selectedSchemas,
  ignoredSchemas = [],
}: {
  selectedSchemas: string[]
  ignoredSchemas?: string[]
}) {
  const schemasList =
    selectedSchemas.length > 0 ? selectedSchemas.map((s) => `'${s}'`).join(', ') : "''"

  return /* SQL */ `
    with ${getTableGrantsCTEs({ ignoredSchemas })}
    select
      count(*)::int as total_count,
      (count(*) filter (where status = 'granted' and schema_name in (${schemasList})))::int as grants_count
    from table_grants
  `
}

/**
 * Builds the shared `function_privileges` and `function_grants` CTEs used by
 * both the exposed-functions list query and the counts-only query.
 *
 * Returns SQL text meant to follow `WITH` (no leading `WITH` keyword).
 * Callers that append additional CTEs should add a comma after interpolation.
 */
function getFunctionGrantsCTEs({
  search,
  ignoredSchemas = [],
}: { search?: string; ignoredSchemas?: string[] } = {}) {
  const IGNORED_SCHEMAS_LIST = ignoredSchemas.map((s) => `'${s}'`).join(', ')

  return /* SQL */ `
    function_privileges as (
      select
        n.nspname as schema_name,
        p.proname as name,

        -- Aggregate EXECUTE across all overloads + all 3 roles
        bool_or(pr.rolname = 'anon' and acl.privilege_type = 'EXECUTE') as anon_execute,
        bool_or(pr.rolname = 'authenticated' and acl.privilege_type = 'EXECUTE') as auth_execute,
        bool_or(pr.rolname = 'service_role' and acl.privilege_type = 'EXECUTE') as srv_execute

      from pg_proc p
      join pg_namespace n
        on n.oid = p.pronamespace
      left join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
        on true
      left join pg_roles pr
        on pr.oid = acl.grantee
      where p.prokind in ('f', 'w')
        ${IGNORED_SCHEMAS_LIST ? `and n.nspname not in (${IGNORED_SCHEMAS_LIST})` : ''}
        ${search ? `and (n.nspname || '.' || p.proname) ilike '%${search}%'` : ''}
      group by n.nspname, p.proname
    ),
    function_grants as (
      select
        schema_name,
        name,
        case
          when anon_execute and auth_execute and srv_execute then 'granted'
          when not (anon_execute or auth_execute or srv_execute) then 'revoked'
          else 'custom'
        end as status
      from function_privileges
    )
  `
}

export function getExposedFunctionsSql({
  search,
  offset,
  limit,
  ignoredSchemas = [],
}: {
  search?: string
  offset: number
  limit: number
  ignoredSchemas?: string[]
}) {
  return /* SQL */ `
    with ${getFunctionGrantsCTEs({ search, ignoredSchemas })}
    select
      (select count(*)::int from function_grants) as total_count,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'schema', fg.schema_name,
              'name', fg.name,
              'status', fg.status
            )
          )
          from (
            select *
            from function_grants
            order by schema_name, name
            offset ${offset}
            limit ${limit}
          ) fg
        ),
        '[]'::jsonb
      ) as functions;
  `
}

export function getExposedFunctionCountsSql({
  selectedSchemas,
  ignoredSchemas = [],
}: {
  selectedSchemas: string[]
  ignoredSchemas?: string[]
}) {
  const schemasList =
    selectedSchemas.length > 0 ? selectedSchemas.map((s) => `'${s}'`).join(', ') : "''"

  return /* SQL */ `
    with ${getFunctionGrantsCTEs({ ignoredSchemas })}
    select
      count(*)::int as total_count,
      (count(*) filter (where status = 'granted' and schema_name in (${schemasList})))::int as grants_count
    from function_grants
  `
}

export function getDefaultPrivilegesStateSql({ schema = 'public' }: { schema?: string } = {}) {
  return /* SQL */ `
    select
      count(*)::int as grant_count
    from pg_default_acl d
    join pg_namespace n on n.oid = d.defaclnamespace
    join pg_roles r on r.oid = d.defaclrole
    where n.nspname = '${schema}'
      and r.rolname = 'postgres'
      and d.defaclobjtype in ('r', 'f', 'S')
      and exists (
        select 1
        from aclexplode(d.defaclacl) acl
        join pg_roles gr on gr.oid = acl.grantee
        where gr.rolname in ('anon', 'authenticated', 'service_role')
      )
  `
}

export function buildDefaultPrivilegesSql(action: 'grant' | 'revoke') {
  const roles = ['anon', 'authenticated', 'service_role']
  const statements: string[] = []

  for (const role of roles) {
    if (action === 'grant') {
      statements.push(
        `alter default privileges for role postgres in schema public grant select, insert, update, delete on tables to ${role}`,
        `alter default privileges for role postgres in schema public grant execute on functions to ${role}`,
        `alter default privileges for role postgres in schema public grant usage, select on sequences to ${role}`
      )
    } else {
      statements.push(
        `alter default privileges for role postgres in schema public revoke select, insert, update, delete on tables from ${role}`,
        `alter default privileges for role postgres in schema public revoke execute on functions from ${role}`,
        `alter default privileges for role postgres in schema public revoke usage, select on sequences from ${role}`
      )
    }
  }

  if (action === 'revoke') {
    statements.push(
      `alter default privileges for role postgres in schema public revoke execute on functions from public`
    )
  } else {
    statements.push(
      `alter default privileges for role postgres in schema public grant execute on functions to public`
    )
  }

  return statements.join(';\n') + ';'
}

export const buildTablePrivilegesSql = (oids: number[], action: 'grant' | 'revoke') => {
  if (oids.length === 0) return ''

  const privilegeClause =
    action === 'grant'
      ? 'grant select, insert, update, delete on table %I.%I to anon, authenticated, service_role'
      : 'revoke all on table %I.%I from anon, authenticated, service_role'

  return /* SQL */ `
    do $$
    declare
      nspname name;
      relname name;
    begin
      for nspname, relname in
        select n.nspname, c.relname
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where c.oid in (${oids.join(', ')})
      loop
        execute format('${privilegeClause}', nspname, relname);
      end loop;
    end $$;
  `
}

export const buildFunctionPrivilegesSql = (schemaNames: string[], action: 'grant' | 'revoke') => {
  if (schemaNames.length === 0) return ''

  const tuples = schemaNames
    .map((sn) => {
      const dotIdx = sn.indexOf('.')
      const schema = sn.slice(0, dotIdx)
      const name = sn.slice(dotIdx + 1)
      return `('${schema}','${name}')`
    })
    .join(', ')

  const privilegeClause =
    action === 'grant'
      ? 'grant execute on function %I.%I(%s) to anon, authenticated, service_role'
      : 'revoke all on function %I.%I(%s) from anon, authenticated, service_role'

  return /* SQL */ `
    do $$
    declare
      nspname name;
      proname name;
      arg_types text;
    begin
      for nspname, proname, arg_types in
        select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where (n.nspname, p.proname) in (${tuples})
      loop
        execute format('${privilegeClause}', nspname, proname, arg_types);
      end loop;
    end $$;
  `
}
