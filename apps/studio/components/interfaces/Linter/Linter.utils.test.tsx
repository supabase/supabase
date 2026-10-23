import { describe, expect, it } from 'vitest'

import { SEARCH_PARAMS_PARSER } from '../UnifiedLogs/UnifiedLogs.constants'
import { parseLogsFilterUrlParams } from '../UnifiedLogs/UnifiedLogs.filters'
import { lintInfoMap, parseLinterLevel } from './Linter.utils'
import { LINTER_LEVELS } from '@/components/interfaces/Linter/Linter.constants'
import { Lint } from '@/data/lint/lint-query'

const projectRef = 'abc'
const trickySchema = 'a&b=c'
const trickyName = 'd e+f'

describe('Linter.utils lintInfoMap link encoding', () => {
  const cases: Array<{ name: string; nameParam?: string; hasSchema: boolean }> = [
    { name: 'unindexed_foreign_keys', hasSchema: true },
    { name: 'unused_index', nameParam: 'table', hasSchema: true },
    { name: 'multiple_permissive_policies', nameParam: 'search', hasSchema: true },
    { name: 'policy_exists_rls_disabled', nameParam: 'search', hasSchema: true },
    { name: 'rls_enabled_no_policy', nameParam: 'search', hasSchema: true },
    { name: 'duplicate_index', nameParam: 'table', hasSchema: true },
    { name: 'function_search_path_mutable', nameParam: 'search', hasSchema: true },
    { name: 'rls_disabled_in_public', nameParam: 'search', hasSchema: true },
    { name: 'extension_in_public', nameParam: 'filter', hasSchema: false },
    { name: 'sensitive_columns_exposed', nameParam: 'table', hasSchema: true },
    { name: 'rls_policy_always_true', nameParam: 'search', hasSchema: true },
    { name: 'pg_graphql_anon_table_exposed', nameParam: 'table', hasSchema: true },
    { name: 'pg_graphql_authenticated_table_exposed', nameParam: 'table', hasSchema: true },
    { name: 'anon_security_definer_function_executable', nameParam: 'search', hasSchema: true },
    {
      name: 'authenticated_security_definer_function_executable',
      nameParam: 'search',
      hasSchema: true,
    },
  ]

  for (const { name, nameParam, hasSchema } of cases) {
    it(`preserves special characters in metadata for ${name}`, () => {
      const info = lintInfoMap.find((entry) => entry.name === name)
      expect(info, `expected ${name} in lintInfoMap`).toBeDefined()

      const url = info!.link({
        projectRef,
        metadata: {
          schema: trickySchema,
          name: trickyName,
        } as unknown as Lint['metadata'],
      })

      const parsed = new URL(url, 'http://example.com')

      if (hasSchema) {
        expect(parsed.searchParams.get('schema')).toBe(trickySchema)
      }
      if (nameParam) {
        expect(parsed.searchParams.get(nameParam)).toBe(trickyName)
      }
    })
  }

  it('preserves slash and space in bucket_id for public_bucket_allows_listing', () => {
    const info = lintInfoMap.find((entry) => entry.name === 'public_bucket_allows_listing')
    expect(info).toBeDefined()
    const url = info!.link({
      projectRef,
      metadata: {
        bucket_id: 'a/b c',
      } as unknown as Lint['metadata'],
    })
    expect(url).toBe('/project/abc/storage/files/buckets/a%2Fb%20c')
  })
})

describe('Linter.utils lintInfoMap pitr_archiving_stale entry', () => {
  it('registers a security entry linking to the PITR settings page', () => {
    const info = lintInfoMap.find((entry) => entry.name === 'pitr_archiving_stale')
    expect(info, 'expected pitr_archiving_stale in lintInfoMap').toBeDefined()

    expect(info!.category).toBe('security')
    // metadata is unused by this entry's link(), and every field on Lint['metadata'] is optional, so {} needs no cast
    expect(info!.link({ projectRef, metadata: {} })).toBe('/project/abc/database/backups/pitr')
    expect(info!.docsLink).toContain('/guides/platform/backups#point-in-time-recovery')
  })
})

describe('parseLinterLevel', () => {
  it('returns the matching level', () => {
    expect(parseLinterLevel('ERROR')).toBe(LINTER_LEVELS.ERROR)
    expect(parseLinterLevel('WARN')).toBe(LINTER_LEVELS.WARN)
    expect(parseLinterLevel('INFO')).toBe(LINTER_LEVELS.INFO)
  })

  it('returns undefined for values that are not a level', () => {
    expect(parseLinterLevel('error')).toBeUndefined()
    expect(parseLinterLevel('SOMETHING_ELSE')).toBeUndefined()
    expect(parseLinterLevel(undefined)).toBeUndefined()
  })
})

describe('health advisor log links', () => {
  const errorAdvisors = [
    {
      name: 'log_data_api_error_rate_high',
      logType: 'edge',
      route: 'edge-logs',
      legacyFilters: { product: { database: true }, status_code: { error: true } },
      serviceFilters: [{ column: 'pathname', operator: '=', value: '/rest/v1' }],
    },
    {
      name: 'log_auth_error_rate_high',
      logType: 'auth',
      route: 'auth-logs',
      legacyFilters: { severity: { error: true } },
      serviceFilters: [],
    },
    {
      name: 'log_storage_error_rate_high',
      logType: 'storage',
      route: 'edge-logs',
      legacyFilters: { product: { storage: true }, status_code: { error: true } },
      serviceFilters: [],
    },
    {
      name: 'log_edge_function_error_rate_high',
      logType: 'edge function',
      route: 'edge-functions-logs',
      legacyFilters: { status_code: { error: true } },
      serviceFilters: [],
    },
  ]

  const getLink = (name: string, isUnifiedLogsEnabled?: boolean) => {
    const info = lintInfoMap.find((entry) => entry.name === name)
    if (!info) throw new Error(`Missing advisor ${name}`)
    return new URL(
      info.link({ projectRef, metadata: {}, isUnifiedLogsEnabled }),
      'https://example.com'
    )
  }

  it.each(errorAdvisors)(
    'shows $name errors for its service in unified logs',
    ({ name, logType, serviceFilters }) => {
      const url = getLink(name, true)
      expect(url.pathname).toBe('/project/abc/logs')
      const filter = SEARCH_PARAMS_PARSER.filter.parse(url.searchParams.get('filter') ?? '')
      expect(parseLogsFilterUrlParams(filter)).toEqual([
        { column: 'log_type', operator: '=', value: logType },
        { column: 'level', operator: '=', value: 'error' },
        ...serviceFilters,
      ])
    }
  )

  it.each(errorAdvisors)(
    'keeps $name filtered when unified logs are disabled',
    ({ name, route, legacyFilters }) => {
      const url = getLink(name, false)
      expect(url.pathname).toBe(`/project/abc/logs/${route}`)
      expect(JSON.parse(url.searchParams.get('f') ?? '{}')).toEqual(legacyFilters)
      expect(url.searchParams.has('filter')).toBe(false)
    }
  )

  it.each([true, false, undefined])(
    'keeps all database diagnostic levels with unified preference %s',
    (isUnifiedLogsEnabled) => {
      const url = getLink('instance_db_down', isUnifiedLogsEnabled)
      if (isUnifiedLogsEnabled) {
        expect(url.pathname).toBe('/project/abc/logs')
        const filter = SEARCH_PARAMS_PARSER.filter.parse(url.searchParams.get('filter') ?? '')
        expect(parseLogsFilterUrlParams(filter)).toEqual([
          { column: 'log_type', operator: '=', value: 'postgres' },
        ])
      } else {
        expect(url.pathname).toBe('/project/abc/logs/postgres-logs')
        expect(url.search).toBe('')
      }
    }
  )

  it.each([true, false])(
    'preserves non-log advisor destinations with unified preference %s',
    (isUnifiedLogsEnabled) => {
      expect(getLink('db_not_reachable', isUnifiedLogsEnabled).pathname).toBe(
        '/project/abc/database/settings'
      )
      expect(getLink('db_connection_limit_reached', isUnifiedLogsEnabled).pathname).toBe(
        '/project/abc/observability/connections'
      )
      expect(getLink('instance_alert_firing', isUnifiedLogsEnabled).pathname).toBe(
        '/project/abc/settings/infrastructure'
      )
      expect(getLink('pitr_archiving_stale', isUnifiedLogsEnabled).pathname).toBe(
        '/project/abc/database/backups/pitr'
      )
    }
  )
})
