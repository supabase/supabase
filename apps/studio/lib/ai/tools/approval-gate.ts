import { acceptUntrustedSql } from '@supabase/pg-meta'

import { acceptUntrustedLogsSql } from '@/data/logs/safe-analytics-sql'

/**
 * What an approval-gated tool's `execute` uses to turn untrusted SQL into trusted SQL.
 *
 * Promoting untrusted SQL is only valid once the user has approved the tool call. The SDK
 * calls `execute` only after approval, and `approvalGatedToolFromContract` is the only place
 * that hands this gate to an `execute`. `*.server.ts` tool files can't import the raw
 * `accept*` functions (see `eslint.config.cjs`), so they can't promote SQL without it.
 */
export type ApprovalGate = {
  acceptUntrustedSql: typeof acceptUntrustedSql
  acceptUntrustedLogsSql: typeof acceptUntrustedLogsSql
}

export const approvalGate: ApprovalGate = { acceptUntrustedSql, acceptUntrustedLogsSql }
