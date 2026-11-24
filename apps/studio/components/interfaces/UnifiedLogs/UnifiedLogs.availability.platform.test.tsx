import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import type { platformComponents as components } from 'api-types'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { UnifiedLogs } from './UnifiedLogs'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type AnalyticsResponse = components['schemas']['AnalyticsResponse_Output']
type ProjectResponse = components['schemas']['ProjectDetailResponse_Output']
mockAnimationsApi()

describe('available unified log types', () => {
  beforeEach(() => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<ProjectResponse>({
          id: 1,
          ref: 'default',
          organization_id: 1,
          name: 'Test Project',
          status: 'INACTIVE',
          cloud_provider: 'AWS',
          region: 'us-east-1',
          db_host: 'db.default.supabase.co',
          restUrl: 'https://default.supabase.co/rest/v1/',
          inserted_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          subscription_id: 'sub_123',
          is_branch_enabled: false,
          is_physical_backups_enabled: false,
          high_availability: false,
          integration_source: null,
          connectionString: null,
        }),
    })
  })

  it.each([
    { useOtel: true, compute: true },
    { useOtel: true, compute: false },
    { useOtel: false, compute: true },
  ])(
    'matches first-load requests to the picker with OTEL $useOtel and Compute $compute',
    async ({ useOtel, compute }) => {
      const queries: string[] = []
      const onUrlUpdate = vi.fn()
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      addAPIMock({
        method: 'post',
        path: useOtel
          ? '/platform/projects/:ref/analytics/endpoints/logs.all.otel'
          : '/platform/projects/:ref/analytics/endpoints/logs.all',
        response: async ({ request }) => {
          queries.push(z.object({ sql: z.string() }).parse(await request.json()).sql)
          return HttpResponse.json<AnalyticsResponse>({ result: [] })
        },
      })
      customRender(
        <FeatureFlagContext.Provider
          value={{ configcat: { otelUnifiedLogs: useOtel, compute }, posthog: {}, hasLoaded: true }}
        >
          <UnifiedLogs />
        </FeatureFlagContext.Provider>,
        { queryClient, nuqs: { hasMemory: true, onUrlUpdate } }
      )
      await screen.findByText('No results found')
      await waitFor(() => expect(queryClient.isFetching()).toBe(0))
      expect(queries.length).toBeGreaterThanOrEqual(3)
      expect(screen.getByRole('checkbox', { name: /^Edge Function \d+ Only$/ })).toBeVisible()
      expect(
        screen.queryByRole('checkbox', { name: /Edge Function runtime/ })
      ).not.toBeInTheDocument()
      expect(screen.queryByRole('checkbox', { name: /^Multigres/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('checkbox', { name: /^Pipelines/ })).not.toBeInTheDocument()
      if (useOtel && compute) {
        expect(screen.getByRole('checkbox', { name: /^Compute/ })).toBeVisible()
      } else {
        expect(screen.queryByRole('checkbox', { name: /^Compute/ })).not.toBeInTheDocument()
      }
      for (const sql of queries) {
        if (useOtel) {
          const clauses = [...sql.matchAll(/FROM logs\s+WHERE ([\s\S]*?)(?:GROUP BY|ORDER BY|$)/g)]
          expect(clauses.length).toBeGreaterThan(0)
          for (const [, where] of clauses) {
            const allowed = where.split(' AND ')[0]
            for (const source of [
              'edge_logs',
              'postgres_logs',
              'auth_logs',
              'postgrest_logs',
              'storage_logs',
              'realtime_logs',
              'supavisor_logs',
              'pgbouncer_logs',
              'function_edge_logs',
            ]) {
              expect(allowed).toContain(`source = '${source}'`)
            }
            for (const source of ['function_logs', 'multigres_logs', 'etl_replication_logs']) {
              expect(allowed).not.toContain(`source = '${source}'`)
            }
            expect(allowed.includes("log_attributes['subservice']")).toBe(compute)
          }
        } else {
          expect(sql).toContain('from function_edge_logs')
          expect(sql).toContain('from auth_logs')
          expect(sql).not.toContain('from etl_replication_logs')
          expect(sql).not.toContain('worker_ingress_logs')
          expect(screen.queryByRole('checkbox', { name: /^Realtime/ })).not.toBeInTheDocument()
        }
      }
      for (const [update] of onUrlUpdate.mock.calls) {
        expect(update.searchParams.get('filter')).toBeNull()
      }
    }
  )
})
