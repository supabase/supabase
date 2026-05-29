import { literal, safeSql, type SafeSqlFragment } from '../../pg-format'

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
  `
}

function getCustomRoleImpersonationSql(roleName: string): SafeSqlFragment {
  return safeSql`
    set local role ${literal(roleName)};
  `
}

// Includes getPostgrestRoleImpersonationSql() and wrapWithRoleImpersonation()
export const ROLE_IMPERSONATION_SQL_LINE_COUNT = 11
export const ROLE_IMPERSONATION_NO_RESULTS = safeSql`ROLE_IMPERSONATION_NO_RESULTS`

export const getImpersonationSQL = ({
  role,
  unexpiredClaims,
  sql,
}: {
  role: {
    type: 'postgrest' | 'custom'
    role: string
  }
  unexpiredClaims?: Object
  sql: SafeSqlFragment
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

    ${sql}
  `
}
