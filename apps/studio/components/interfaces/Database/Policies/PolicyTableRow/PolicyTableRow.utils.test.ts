import { describe, expect, it } from 'vitest'

import { getTableAdmonitionMessage, getTableDataApiStatus } from './PolicyTableRow.utils'
import type { TableApiAccessData } from '@/data/privileges/table-api-access-query'
import type { ApiPrivilegesByRole } from '@/lib/data-api-types'

const FULL_PRIVILEGES: ApiPrivilegesByRole = {
  anon: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  authenticated: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  service_role: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
}

const PARTIAL_PRIVILEGES: ApiPrivilegesByRole = {
  anon: ['SELECT'],
  authenticated: [],
  service_role: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
}

const grantedAccess: TableApiAccessData = {
  apiAccessType: 'access',
  grantStatus: 'granted',
  privileges: FULL_PRIVILEGES,
}

const customAccess: TableApiAccessData = {
  apiAccessType: 'access',
  grantStatus: 'custom',
  privileges: PARTIAL_PRIVILEGES,
}

const noGrants: TableApiAccessData = { apiAccessType: 'exposed-schema-no-grants' }
const schemaNotExposedData: TableApiAccessData = { apiAccessType: 'none' }

describe('getTableDataApiStatus', () => {
  it('returns schema-not-exposed when the schema is not in the exposed list', () => {
    const status = getTableDataApiStatus({
      isSchemaExposed: false,
      apiAccessData: grantedAccess,
      isRLSEnabled: true,
      policiesCount: 1,
    })
    expect(status).toBe('schema-not-exposed')
  })

  it('returns no-grants when schema is exposed but no API roles have privileges', () => {
    const status = getTableDataApiStatus({
      isSchemaExposed: true,
      apiAccessData: noGrants,
      isRLSEnabled: true,
      policiesCount: 0,
    })
    expect(status).toBe('no-grants')
  })

  it('returns custom-grants for partial/non-standard grants — even if RLS is off', () => {
    const status = getTableDataApiStatus({
      isSchemaExposed: true,
      apiAccessData: customAccess,
      isRLSEnabled: false,
      policiesCount: 0,
    })
    expect(status).toBe('custom-grants')
  })

  it('returns publicly-readable when fully granted and RLS is off', () => {
    const status = getTableDataApiStatus({
      isSchemaExposed: true,
      apiAccessData: grantedAccess,
      isRLSEnabled: false,
      policiesCount: 3,
    })
    expect(status).toBe('publicly-readable')
  })

  it('returns locked-by-rls when fully granted + RLS on + no policies', () => {
    const status = getTableDataApiStatus({
      isSchemaExposed: true,
      apiAccessData: grantedAccess,
      isRLSEnabled: true,
      policiesCount: 0,
    })
    expect(status).toBe('locked-by-rls')
  })

  it('returns secured when fully granted + RLS on + policies exist', () => {
    const status = getTableDataApiStatus({
      isSchemaExposed: true,
      apiAccessData: grantedAccess,
      isRLSEnabled: true,
      policiesCount: 2,
    })
    expect(status).toBe('secured')
  })

  it('returns unknown when apiAccessData is still loading or errored', () => {
    // apiAccessData is undefined during loading AND on query error (isPending flips false
    // but data stays undefined). We must not fall through to 'schema-not-exposed' — that
    // would tell the user to reconfigure API settings for a schema that is in fact exposed.
    const status = getTableDataApiStatus({
      isSchemaExposed: true,
      apiAccessData: undefined,
      isRLSEnabled: true,
      policiesCount: 0,
    })
    expect(status).toBe('unknown')
  })

  it('returns unknown when apiAccessData reports apiAccessType=none on an exposed schema', () => {
    // Defensive: the query shouldn't emit apiAccessType=none when schema is exposed,
    // but if it does we still don't want the false "schema not exposed" admonition.
    const status = getTableDataApiStatus({
      isSchemaExposed: true,
      apiAccessData: schemaNotExposedData,
      isRLSEnabled: true,
      policiesCount: 0,
    })
    expect(status).toBe('unknown')
  })

  it('isSchemaExposed=false wins over any apiAccessData value', () => {
    const status = getTableDataApiStatus({
      isSchemaExposed: false,
      apiAccessData: noGrants,
      isRLSEnabled: true,
      policiesCount: 0,
    })
    expect(status).toBe('schema-not-exposed')
  })

  it('custom-grants wins over RLS state — we never claim public-readable for partial grants', () => {
    const rlsOff = getTableDataApiStatus({
      isSchemaExposed: true,
      apiAccessData: customAccess,
      isRLSEnabled: false,
      policiesCount: 0,
    })
    const rlsOnNoPolicies = getTableDataApiStatus({
      isSchemaExposed: true,
      apiAccessData: customAccess,
      isRLSEnabled: true,
      policiesCount: 0,
    })
    expect(rlsOff).toBe('custom-grants')
    expect(rlsOnNoPolicies).toBe('custom-grants')
  })
})

describe('getTableAdmonitionMessage', () => {
  it('returns the custom-grants copy', () => {
    expect(getTableAdmonitionMessage('custom-grants')).toBe(
      'This table has custom Data API permissions — access may be restricted for some roles or operations.'
    )
  })

  it('returns the no-grants copy', () => {
    expect(getTableAdmonitionMessage('no-grants')).toBe(
      'This table cannot be accessed via the Data API. Enable access in your project’s Data API settings.'
    )
  })

  it('returns the publicly-readable copy', () => {
    expect(getTableAdmonitionMessage('publicly-readable')).toBe(
      'This table can be accessed by anyone via the Data API as RLS is disabled.'
    )
  })

  it('returns the locked-by-rls copy', () => {
    expect(getTableAdmonitionMessage('locked-by-rls')).toBe(
      'No data will be returned via the Data API as no RLS policies exist on this table.'
    )
  })

  it('returns null for secured — no admonition needed', () => {
    expect(getTableAdmonitionMessage('secured')).toBeNull()
  })

  it('returns null for schema-not-exposed — handled by a separate admonition with a link', () => {
    expect(getTableAdmonitionMessage('schema-not-exposed')).toBeNull()
  })

  it('returns null for unknown — caller should stay silent during loading/errored state', () => {
    expect(getTableAdmonitionMessage('unknown')).toBeNull()
  })
})
