import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import {
  lookupApprovedQuery,
  selectPublicClientKey,
  summarizeGeneratedPageCapabilities,
  type ApprovedGeneratedPageQueries,
} from './generated-page.utils'
import { acceptUntrustedLogsSql, untrustedLogSql } from '@/data/logs/safe-analytics-sql'
import type { RenderPageInput } from '@/lib/ai/tools/generated-page-schema'

const approved: ApprovedGeneratedPageQueries = {
  database: new Map([
    [
      'recent_users',
      {
        title: 'Recent users',
        sql: acceptUntrustedSql(untrustedSql('select id from auth.users')),
        rowLimit: 50,
      },
    ],
  ]),
  logs: new Map([
    [
      'auth_errors',
      {
        title: 'Auth errors',
        sql: acceptUntrustedLogsSql(
          untrustedLogSql("select count() from logs where source = 'auth_logs' limit 1")
        ),
        timeRange: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
      },
    ],
  ]),
}

describe('lookupApprovedQuery', () => {
  it('resolves an approved id to its promoted fragment', () => {
    const result = lookupApprovedQuery(approved, {
      type: 'query',
      requestId: 'r1',
      kind: 'database',
      queryId: 'recent_users',
    })

    expect(result.status).toBe('database')
  })

  it('rejects an id the user never approved', () => {
    const result = lookupApprovedQuery(approved, {
      type: 'query',
      requestId: 'r1',
      kind: 'database',
      queryId: 'drop_everything',
    })

    expect(result).toEqual({
      status: 'rejected',
      message: 'Database query "drop_everything" was not approved for this page.',
    })
  })

  it('does not let a database id be run as a logs query, or the reverse', () => {
    expect(
      lookupApprovedQuery(approved, {
        type: 'query',
        requestId: 'r1',
        kind: 'logs',
        queryId: 'recent_users',
      }).status
    ).toBe('rejected')

    expect(
      lookupApprovedQuery(approved, {
        type: 'query',
        requestId: 'r1',
        kind: 'database',
        queryId: 'auth_errors',
      }).status
    ).toBe('rejected')
  })

  it('rejects everything once the page has been stopped', () => {
    expect(
      lookupApprovedQuery(null, {
        type: 'query',
        requestId: 'r1',
        kind: 'database',
        queryId: 'recent_users',
      })
    ).toEqual({ status: 'rejected', message: 'This page is not running.' })
  })
})

const publishableKey = {
  id: '1',
  name: 'default',
  type: 'publishable' as const,
  api_key: 'sb_publishable_abc',
  inserted_at: '2026-01-01',
}

const legacyAnonKey = {
  id: '2',
  name: 'anon',
  type: 'legacy' as const,
  api_key: 'anon-jwt',
  secret_jwt_template: { role: 'anon' },
}

const legacyServiceRoleKey = {
  id: '3',
  name: 'service_role',
  type: 'legacy' as const,
  api_key: 'service-role-jwt',
  secret_jwt_template: { role: 'service_role' },
}

describe('selectPublicClientKey', () => {
  it('prefers the publishable key', () => {
    expect(selectPublicClientKey({ publishableKey, anonKey: legacyAnonKey })).toEqual({
      apiKey: 'sb_publishable_abc',
      kind: 'publishable',
    })
  })

  it('falls back to the legacy anon key on projects with no publishable key', () => {
    expect(selectPublicClientKey({ anonKey: legacyAnonKey })).toEqual({
      apiKey: 'anon-jwt',
      kind: 'legacy_anon',
    })
  })

  it('never returns a service-role or secret key', () => {
    expect(selectPublicClientKey({ anonKey: legacyServiceRoleKey })).toBeUndefined()
    expect(
      selectPublicClientKey({
        anonKey: { ...legacyAnonKey, secret_jwt_template: { role: 'service_role' } },
      })
    ).toBeUndefined()
    expect(
      selectPublicClientKey({
        publishableKey: {
          id: '4',
          name: 'secret',
          type: 'secret',
          api_key: 'sb_secret_abc',
          hash: 'hash',
          prefix: 'sb_secret',
          inserted_at: '2026-01-01',
          secret_jwt_template: { role: 'service_role' },
        },
      })
    ).toBeUndefined()
  })

  it('returns nothing when no eligible key is present', () => {
    expect(selectPublicClientKey(undefined)).toBeUndefined()
    expect(selectPublicClientKey({})).toBeUndefined()
  })
})

describe('summarizeGeneratedPageCapabilities', () => {
  const base: RenderPageInput = {
    title: 'Auth console',
    html: '<div></div>',
    database_queries: [],
    log_queries: [],
    enable_supabase_client: false,
  }

  it('lists every capability the page was granted', () => {
    expect(
      summarizeGeneratedPageCapabilities({
        ...base,
        database_queries: [
          { id: 'a', title: 'A', sql: 'select 1', row_limit: 10 },
          { id: 'b', title: 'B', sql: 'select 2', row_limit: 10 },
        ],
        log_queries: [
          {
            id: 'c',
            title: 'C',
            sql: "select 1 from logs where source = 'auth_logs' limit 1",
            time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
          },
        ],
        enable_supabase_client: true,
      })
    ).toBe('2 database queries · 1 logs query · Supabase client, subject to RLS')
  })

  it('says so when the page gets nothing', () => {
    expect(summarizeGeneratedPageCapabilities(base)).toBe(
      'Runs in a sandbox with no access to your project'
    )
  })
})
