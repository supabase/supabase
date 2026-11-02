import { ident, joinSqlFragments, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'
import type { PGPolicy } from '@supabase/pg-meta'
import { ReactNode } from 'react'

import { InlineLink } from '@/components/ui/InlineLink'
import type { TableApiAccessData } from '@/data/privileges/table-api-access-query'

export type Policy = Omit<PGPolicy, 'definition' | 'check'> & {
  definition: SafeSqlFragment | null
  check: SafeSqlFragment | null
}

/**
 * Single classifier for the RLS page's per-table admonition state. Shares the
 * "granted / custom / revoked" grant semantics used by the Data API settings
 * page's ExposedTableSelector so the two views agree on what counts as exposed.
 */
export type TableDataApiStatus =
  | 'no-grants' // schema exposed, no API roles have any privileges (revoked)
  | 'custom-grants' // schema exposed, partial / non-standard grants
  | 'publicly-readable' // fully granted + RLS disabled (dangerous)
  | 'locked-by-rls' // fully granted + RLS enabled, no policies
  | 'secured' // fully granted + RLS enabled, policies exist
  | 'unknown' // privileges query is still loading or errored — caller should stay silent

export function getTableDataApiStatus({
  apiAccessData,
  isRLSEnabled,
  policiesCount,
}: {
  apiAccessData: TableApiAccessData | undefined
  isRLSEnabled: boolean
  policiesCount: number
}): TableDataApiStatus {
  if (apiAccessData?.apiAccessType === 'exposed-schema-no-grants') return 'no-grants'
  if (apiAccessData?.apiAccessType === 'access') {
    if (apiAccessData.grantStatus === 'custom') return 'custom-grants'
    if (!isRLSEnabled) return 'publicly-readable'
    if (policiesCount === 0) return 'locked-by-rls'
    return 'secured'
  }
  // Schema is exposed but the privileges query hasn't resolved (still loading
  // or errored). We return 'unknown' rather than 'schema-not-exposed' so the
  // caller doesn't falsely tell the user to reconfigure API settings.
  return 'unknown'
}

/**
 * Returns the copy for the in-row admonition, or null when the row needs no
 * admonition (the "everything is fine" `secured` case and the orthogonal
 * `schema-not-exposed` case which is rendered separately with a link).
 */
export function getTableAdmonitionMessage({
  status,
  ref = '_',
}: {
  status: TableDataApiStatus
  ref?: string
}): ReactNode | null {
  switch (status) {
    case 'custom-grants':
      return (
        <p>
          This table has custom Data API permissions — access may be restricted for some roles or
          operations.
        </p>
      )
    case 'no-grants':
      return (
        <p>
          This table cannot be accessed via the Data API. Enable access in your project’s{' '}
          <InlineLink href={`/project/${ref}/integrations/data_api/settings`}>
            Data API settings
          </InlineLink>
          .
        </p>
      )
    case 'publicly-readable':
      return <p>This table can be accessed by anyone via the Data API as RLS is disabled.</p>
    case 'locked-by-rls':
      return (
        <p>No data will be returned via the Data API as no RLS policies exist on this table.</p>
      )
    default:
      return null
  }
}

export const generatePolicyUpdateSQL = (policy: Policy): SafeSqlFragment => {
  const parts: Array<SafeSqlFragment> = []

  if (policy.definition != null) {
    const semicolon = policy.check == null ? safeSql`;` : safeSql``
    parts.push(safeSql`using (${policy.definition})${semicolon}`)
  }
  if (policy.check != null) {
    parts.push(safeSql`with check (${policy.check});`)
  }

  const expression = parts.length > 0 ? joinSqlFragments(parts, '\n') : safeSql``

  return safeSql`
alter policy ${ident(policy.name)}
on ${ident(policy.schema)}.${ident(policy.table)}
to ${joinSqlFragments(policy.roles.map(ident), ', ')}
${expression}`
}
