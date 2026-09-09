import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import {
  queryResultRowQueryOptions,
  queryResultTableQueryOptions,
} from './query-result-table-query'

const projectRef = 'default'
const sql = 'select * from public.items'
const context = { projectRef, sql, connectionString: 'encrypted-connection-before-refresh' }

describe('query result cache identity', () => {
  it('reuses row-action metadata after project details refresh the encrypted connection string', async () => {
    const client = new QueryClient()
    const initial = queryResultTableQueryOptions(context)
    client.setQueryData(initial.queryKey, null)

    const refreshed = queryResultTableQueryOptions({
      ...context,
      connectionString: 'encrypted-connection-after-refresh',
    })
    const refetch = vi.fn(async () => null)
    await client.fetchQuery({ ...refreshed, queryFn: refetch })

    expect(refreshed.queryKey).toEqual(initial.queryKey)
    expect(refetch).not.toHaveBeenCalled()
    client.clear()
  })

  it('keeps an open row query stable when only the encrypted connection changes', () => {
    const args = { ...context, table: { schema: 'public', name: 'items' }, identifiers: { id: 1 } }
    const initial = queryResultRowQueryOptions(args).queryKey
    expect(queryResultRowQueryOptions({ ...args, connectionString: 'refreshed' }).queryKey).toEqual(
      initial
    )
    expect(queryResultRowQueryOptions({ ...args, identifiers: { id: 2 } }).queryKey).not.toEqual(
      initial
    )
    expect(
      queryResultRowQueryOptions({ ...args, table: { schema: 'other', name: 'items' } }).queryKey
    ).not.toEqual(initial)
  })

  it('separates metadata for different projects, queries, and impersonated roles', () => {
    const initial = queryResultTableQueryOptions(context).queryKey
    expect(
      queryResultTableQueryOptions({ ...context, projectRef: 'another-project' }).queryKey
    ).not.toEqual(initial)
    expect(
      queryResultTableQueryOptions({ ...context, sql: 'select * from public.other' }).queryKey
    ).not.toEqual(initial)
    expect(
      queryResultTableQueryOptions({
        ...context,
        roleImpersonationState: {
          role: { type: 'custom', role: 'another_role' },
          claims: undefined,
        },
      }).queryKey
    ).not.toEqual(initial)
  })
})
