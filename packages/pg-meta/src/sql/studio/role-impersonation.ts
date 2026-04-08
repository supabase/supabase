import { literal } from '../../pg-format'

function getPostgrestRoleImpersonationSql({
  role,
  unexpiredClaims,
}: {
  role: string
  unexpiredClaims: Object
}) {
  return `
select set_config('role', ${literal(role)}, true),
set_config('request.jwt.claims', ${literal(JSON.stringify(unexpiredClaims))}, true),
set_config('request.method', 'POST', true),
set_config('request.path', '/impersonation-example-request-path', true),
set_config('request.headers', '{"accept": "*/*"}', true);
  `.trim()
}

function getCustomRoleImpersonationSql(roleName: string) {
  return /* SQL */ `
    set local role ${literal(roleName)};
  `.trim()
}

// Includes getPostgrestRoleImpersonationSql() and wrapWithRoleImpersonation()
export const ROLE_IMPERSONATION_SQL_LINE_COUNT = 11
export const ROLE_IMPERSONATION_NO_RESULTS = 'ROLE_IMPERSONATION_NO_RESULTS'

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
  sql: string
}) => {
  const impersonationSql =
    role.type === 'postgrest'
      ? unexpiredClaims !== undefined
        ? getPostgrestRoleImpersonationSql({ role: role.role, unexpiredClaims })
        : ''
      : getCustomRoleImpersonationSql(role.role)

  return /* SQL */ `
    ${impersonationSql}

    -- If the users sql returns no rows, pg-meta will
    -- fallback to returning the result of the impersonation sql.
    select 1 as "${ROLE_IMPERSONATION_NO_RESULTS}";

    ${sql}
  `.trim()
}
