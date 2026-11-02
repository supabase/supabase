import { QueryClient } from '@tanstack/react-query'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import { createDynamicRouteParser } from 'next-router-mock/dynamic-routes'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { columnSchema, querySearchParamsSchema } from '../UnifiedLogs.schema'
import { LogDetail } from './LogDetail'
import { FeaturePreviewContextProvider } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import { miscKeys } from '@/data/misc/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']
vi.unmock('common')
const { default: routerMock } =
  await vi.importMock<typeof import('next-router-mock')>('next/router')
const removeRouteParser = routerMock.useParser(createDynamicRouteParser(['/project/[ref]/logs']))
afterAll(removeRouteParser)

const row = columnSchema.parse({
  id: 'realtime-log',
  log_type: 'realtime',
  timestamp: '2026-01-01T10:00:00Z',
  date: new Date('2026-01-01T10:00:00Z'),
  event_message: 'Connection opened',
  method: null,
  pathname: null,
  status: null,
  level: 'success',
})

function Harness({ tab }: { tab: 'overview' | 'raw-json' }) {
  const table = useReactTable({ data: [row], columns: [], getCoreRowModel: getCoreRowModel() })
  return (
    <DataTableProvider
      table={table}
      columns={[]}
      filterFields={[]}
      error={null}
      isError={false}
      isLoading={false}
      isFetching={false}
      isLoadingCounts={false}
    >
      <LogDetail
        row={row}
        tab={tab}
        searchParameters={querySearchParamsSchema.parse({
          scope: { filters: [{ column: 'function_id', operator: '=', value: 'fn-1' }] },
        })}
      />
    </DataTableProvider>
  )
}

const renderDetail = (tab: 'overview' | 'raw-json') => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: {
      cloud_provider: 'AWS',
      db_host: 'db.default.supabase.co',
      high_availability: false,
      id: 1,
      inserted_at: '2026-01-01T00:00:00Z',
      integration_source: null,
      is_branch_enabled: false,
      is_physical_backups_enabled: false,
      name: 'Test project',
      organization_id: 1,
      ref: 'default',
      region: 'us-east-1',
      restUrl: 'https://default.supabase.co',
      status: 'ACTIVE_HEALTHY',
      subscription_id: 'subscription-1',
      updated_at: '2026-01-01T00:00:00Z',
      connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
    },
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(miscKeys.enabledFeaturesOverride(), { disabled_features: [] })
  return customRender(
    <FeatureFlagContext.Provider
      value={{
        configcat: {
          otelUnifiedLogs: false,
          otelLegacyLogs: true,
          pipelineCreationWizard: false,
          platformWebhooks: false,
          jitDbAccess: false,
          marketplaceIntegrations: false,
          explorer: false,
          storageVersioningPrivateAlpha: false,
          sqlEditorManualSaveForced: false,
        },
        posthog: {},
        hasLoaded: true,
      }}
    >
      <FeaturePreviewContextProvider>
        <Harness tab={tab} />
      </FeaturePreviewContextProvider>
    </FeatureFlagContext.Provider>,
    { queryClient }
  )
}

describe('log detail attributes', () => {
  beforeEach(() => routerMock.setCurrentUrl('/project/default/logs'))

  it.each(['overview', 'raw-json'] as const)(
    'shows retrieval failures in the %s tab',
    async (tab) => {
      addAPIMock({
        method: 'post',
        path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
        response: () =>
          HttpResponse.json<APIErrorBody>({ message: 'Attributes unavailable' }, { status: 500 }),
      })
      renderDetail(tab)
      expect(await screen.findByText('Failed to retrieve log details')).toBeVisible()
      expect(screen.getByRole('alert')).toHaveTextContent('Attributes unavailable')
      expect(screen.queryByText('Enriching log...')).not.toBeInTheDocument()
    }
  )

  it.each(['overview', 'raw-json'] as const)(
    'shows pending attributes before rendering scoped log details in the %s tab',
    async (tab) => {
      const response = Promise.withResolvers<AnalyticsResponse>()
      addAPIMock({
        method: 'post',
        path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
        response: async () => HttpResponse.json<AnalyticsResponse>(await response.promise),
      })
      renderDetail(tab)
      expect(screen.getByRole('status')).toHaveTextContent('Enriching log...')
      expect(screen.queryByText('subscription-42')).not.toBeInTheDocument()
      response.resolve({
        result: [
          { source: 'realtime_logs', log_attributes: { subscription_id: 'subscription-42' } },
        ],
      })
      await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
      if (tab === 'overview') fireEvent.click(screen.getByRole('button', { name: 'Details' }))
      expect(await screen.findByText(/subscription-42/)).toBeVisible()
    }
  )
})
