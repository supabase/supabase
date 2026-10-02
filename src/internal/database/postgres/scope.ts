import type { TenantConnectionOptions } from '../pool'

export type ScopeConnectionOptions = Pick<
  TenantConnectionOptions,
  'user' | 'method' | 'path' | 'operation'
>

export interface ScopeStatement {
  text: string
  values: unknown[]
}

const SCOPE_CONFIG_SETTERS = `set_config('role', $1, true),
          set_config('request.jwt.claim.role', $2, true),
          set_config('request.jwt', $3, true),
          set_config('request.jwt.claim.sub', $4, true),
          set_config('request.jwt.claims', $5, true),
          set_config('request.headers', $6, true),
          set_config('request.method', $7, true),
          set_config('request.path', $8, true),
          set_config('storage.operation', $9, true),
          set_config('storage.allow_delete_query', 'true', true)`

const SCOPE_CONFIG_SQL = `
        SELECT
          ${SCOPE_CONFIG_SETTERS};
      `

const SCOPE_CONFIG_SQL_WITH_STATEMENT_TIMEOUT = `
        SELECT
          ${SCOPE_CONFIG_SETTERS},
          set_config('statement_timeout', $10, true);
      `

const SCOPE_CONFIG_SQL_WITH_SEARCH_PATH = `
        SELECT
          ${SCOPE_CONFIG_SETTERS},
          set_config('search_path', $10, true);
      `

const SCOPE_CONFIG_SQL_WITH_STATEMENT_TIMEOUT_AND_SEARCH_PATH = `
        SELECT
          ${SCOPE_CONFIG_SETTERS},
          set_config('statement_timeout', $10, true),
          set_config('search_path', $11, true);
      `

export function buildScopeStatement(
  options: ScopeConnectionOptions,
  role: string,
  claimsPayload: string,
  headersPayload: string,
  statementTimeoutMs?: number,
  searchPath?: string
): ScopeStatement {
  const values: unknown[] = [
    role,
    role,
    options.user.jwt || '',
    options.user.payload.sub || '',
    claimsPayload,
    headersPayload,
    options.method || '',
    options.path || '',
    options.operation?.() || '',
  ]

  if (statementTimeoutMs) {
    values.push(`${statementTimeoutMs}ms`)
  }

  if (searchPath) {
    values.push(searchPath)
  }

  return {
    text: getScopeConfigSql(statementTimeoutMs, searchPath),
    values,
  }
}

function getScopeConfigSql(
  statementTimeoutMs: number | undefined,
  searchPath: string | undefined
): string {
  if (statementTimeoutMs && searchPath) {
    return SCOPE_CONFIG_SQL_WITH_STATEMENT_TIMEOUT_AND_SEARCH_PATH
  }

  if (statementTimeoutMs) {
    return SCOPE_CONFIG_SQL_WITH_STATEMENT_TIMEOUT
  }

  if (searchPath) {
    return SCOPE_CONFIG_SQL_WITH_SEARCH_PATH
  }

  return SCOPE_CONFIG_SQL
}
