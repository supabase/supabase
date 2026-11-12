import { literal, safeSql, type SafeSqlFragment } from '../../pg-format'

/**
 * PostgREST runs its `db_pre_request` hook after applying the role and request GUCs, so
 * impersonation has to run it too. Without this, a guard the Data API enforces on every request is
 * silently skipped, and impersonation reports access that a real request would have been denied.
 *
 * The hook is read from the database rather than passed in, because that is where PostgREST reads
 * it from: `ALTER ROLE authenticator SET pgrst.db_pre_request = ...`. Self-hosted deployments can
 * also set it through the `PGRST_DB_PRE_REQUEST` environment variable, which is not visible from
 * the database at all; those keep behaving as they do today.
 *
 * The name is catalog data rather than a value we control, so it is resolved through
 * `to_regprocedure` and re-rendered by Postgres instead of being interpolated into the statement.
 * Anything that doesn't resolve to a zero-argument function is ignored, so a database whose hook is
 * missing or misconfigured impersonates exactly as it does today.
 */
const CALL_DB_PRE_REQUEST_HOOK = safeSql`do $$
declare
  hook_setting text;
  hook regprocedure;
begin
  select regexp_replace(config, '^pgrst\\.db_pre_request=', '')
    into hook_setting
    from pg_catalog.pg_db_role_setting s
    cross join lateral unnest(s.setconfig) as config
    left join pg_catalog.pg_roles r on r.oid = s.setrole
    where config like 'pgrst.db_pre_request=%'
      and (r.rolname = 'authenticator' or s.setrole = 0)
      and s.setdatabase in (0, (select oid from pg_catalog.pg_database where datname = current_database()))
    order by (s.setrole <> 0) desc, (s.setdatabase <> 0) desc
    limit 1;
  if hook_setting is null then
    return;
  end if;
  -- to_regprocedure() returns null for a name that doesn't resolve, but still raises on one that
  -- can't be parsed at all (more than two dotted parts), which must not fail the whole statement.
  begin
    hook := to_regprocedure(hook_setting || '()');
  exception
    when others then
      return;
  end;
  if hook is null then
    return;
  end if;
  execute 'select ' || hook::text;
end
$$;`

function getPostgrestRoleImpersonationSql({
  role,
  unexpiredClaims,
}: {
  role: string
  unexpiredClaims: Object
}): SafeSqlFragment {
  return safeSql`
select set_config('role', ${literal(role)}, true),
set_config('request.jwt.claims', ${literal(JSON.stringify(unexpiredClaims))}, true),
set_config('request.method', 'POST', true),
set_config('request.path', '/impersonation-example-request-path', true),
set_config('request.headers', '{"accept": "*/*"}', true);
${CALL_DB_PRE_REQUEST_HOOK}
  `
}

function getCustomRoleImpersonationSql(roleName: string): SafeSqlFragment {
  return safeSql`
    set local role ${literal(roleName)};
  `
}

export const ROLE_IMPERSONATION_NO_RESULTS = safeSql`ROLE_IMPERSONATION_NO_RESULTS`

type ImpersonationRole = {
  type: 'postgrest' | 'custom'
  role: string
}

/**
 * Everything `getImpersonationSQL()` puts in front of the caller's SQL. Split out so the line
 * offset below is measured from the same string that gets executed, rather than from a hand-kept
 * count that drifts whenever this SQL changes.
 */
const getImpersonationPrefixSQL = ({
  role,
  unexpiredClaims,
}: {
  role: ImpersonationRole
  unexpiredClaims?: Object
}): SafeSqlFragment => {
  const impersonationSql =
    role.type === 'postgrest'
      ? unexpiredClaims !== undefined
        ? getPostgrestRoleImpersonationSql({ role: role.role, unexpiredClaims })
        : safeSql``
      : getCustomRoleImpersonationSql(role.role)

  return safeSql`
    ${impersonationSql}

    -- If the users sql returns no rows, pg-meta will
    -- fallback to returning the result of the impersonation sql.
    select 1 as "${ROLE_IMPERSONATION_NO_RESULTS}";

    `
}

export const getImpersonationSQL = ({
  role,
  unexpiredClaims,
  sql,
}: {
  role: ImpersonationRole
  unexpiredClaims?: Object
  sql: SafeSqlFragment
}): SafeSqlFragment => safeSql`${getImpersonationPrefixSQL({ role, unexpiredClaims })}${sql}
  `

/**
 * How many lines `getImpersonationSQL()` prepended before the caller's SQL, so that a `LINE n:` in
 * a Postgres error can be reported against the line the user actually wrote. Derived from the
 * wrapped statement, because the prefix length depends on which kind of impersonation ran.
 *
 * Returns 0 for SQL that was never wrapped.
 */
export const getRoleImpersonationLineOffset = (sql: string): number => {
  const lines = sql.split('\n')
  const markerIndex = lines.findIndex((line) => line.includes(ROLE_IMPERSONATION_NO_RESULTS))
  if (markerIndex === -1) return 0

  // The caller's SQL starts two lines past the marker: the marker, then a blank line.
  return markerIndex + 2
}
