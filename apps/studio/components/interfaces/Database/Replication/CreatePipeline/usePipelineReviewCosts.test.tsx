import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { useForm } from 'react-hook-form'
import { beforeEach, expect, test } from 'vitest'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { PipelineReviewCosts } from './PipelineReviewCosts'
import { usePipelineReviewCosts } from './usePipelineReviewCosts'
import type { ReplicationCostEstimateData } from '@/data/replication/cost-estimate-query'
import { replicationKeys } from '@/data/replication/keys'
import type { ReplicationPublicationData } from '@/data/replication/publication-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const publication: ReplicationPublicationData = {
  name: 'analytics',
  config: {
    type: 'tables',
    tables: [],
    operations: ['insert'],
    publish_via_partition_root: false,
  },
  tables: [],
}
const defaultValues: DestinationPanelSchemaType = {
  name: 'Analytics',
  publicationName: 'analytics',
  tableSyncCopyMode: 'include_all_tables',
  tableSyncCopyTableIds: [],
  maxFillMs: 500,
  maxTableSyncWorkers: 4,
  maxCopyConnectionsPerTable: 1,
  maxStalenessMins: 0,
  projectId: 'example-project',
  datasetId: 'analytics',
  serviceAccountKey: '',
  connectionPoolSize: 5,
}
const key = replicationKeys.costEstimate('default', 1, 'analytics')
const sources: components['schemas']['SourcesResponse_Output'] = {
  sources: [
    {
      id: 1,
      name: 'default',
      tenant_id: 'tenant',
      config: { host: 'localhost', port: 5432, name: 'postgres', username: 'postgres' },
    },
  ],
}

const ReviewCosts = () => {
  const { control } = useForm<DestinationPanelSchemaType>({ defaultValues })
  const costs = usePipelineReviewCosts({ control, publication })
  return (
    <>
      <PipelineReviewCosts control={control} publication={publication} />
      <button tabIndex={0} disabled={costs.isInitialCostEstimateLoading}>
        Start pipeline
      </button>
    </>
  )
}

beforeEach(() => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: () => HttpResponse.json<components['schemas']['SourcesResponse_Output']>(sources),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources/:source_id/publications/:publication_name/cost-estimate',
    response: () =>
      HttpResponse.json<APIErrorBody>({ message: 'Estimate unavailable' }, { status: 503 }),
  })
})

test('permits starting and shows the unavailable note after the first failure while retrying', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, retryDelay: 60_000 } },
  })
  queryClient.setQueryData(replicationKeys.sources('default'), sources)
  const { unmount } = customRender(<ReviewCosts />, { queryClient })
  const status = screen.getByRole('status')
  expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeDisabled()
  expect(status).toBeEmptyDOMElement()

  await waitFor(() => expect(status).toHaveTextContent('A cost estimate is unavailable.'))

  expect(screen.getByRole('status')).toBe(status)
  expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeEnabled()
  expect(queryClient.getQueryState(key)).toMatchObject({
    status: 'pending',
    fetchStatus: 'fetching',
    fetchFailureCount: 1,
  })
  unmount()
  queryClient.clear()
})

test('keeps cached costs visible after a background refresh fails', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData<ReplicationCostEstimateData>(key, {
    currency: 'usd',
    pipeline: { hourly_cost: 0.05, monthly_cost: 36.5 },
    streaming: { rate_per_gb: 3 },
    table_copy: { rate_per_gb: 0.6, total_bytes: 0, total_cost: 0, tables: [] },
  })
  queryClient.setQueryData(replicationKeys.sources('default'), sources)
  const { unmount } = customRender(<ReviewCosts />, { queryClient })
  await waitFor(() => expect(queryClient.getQueryState(key)?.status).toBe('error'))

  expect(screen.getByText('$0.05/hour')).toBeInTheDocument()
  expect(screen.getByText('$3.00/GB')).toBeInTheDocument()
  expect(screen.getByRole('status')).toBeEmptyDOMElement()
  expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeEnabled()
  unmount()
  queryClient.clear()
})

test('keeps starting available while refetching an estimate that previously failed', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(replicationKeys.sources('default'), sources)
  const { unmount } = customRender(<ReviewCosts />, { queryClient })

  await waitFor(() => expect(queryClient.getQueryState(key)?.status).toBe('error'))
  expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeEnabled()

  let finishRefetch = () => {}
  const refetchResponse = new Promise<void>((resolve) => {
    finishRefetch = resolve
  })
  let markRefetchStarted = () => {}
  const refetchStarted = new Promise<void>((resolve) => {
    markRefetchStarted = resolve
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources/:source_id/publications/:publication_name/cost-estimate',
    response: async () => {
      markRefetchStarted()
      await refetchResponse
      return HttpResponse.json<APIErrorBody>({ message: 'Estimate unavailable' }, { status: 503 })
    },
  })

  try {
    await act(async () => {
      void queryClient.refetchQueries({ queryKey: key })
      await refetchStarted
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(queryClient.getQueryState(key)).toMatchObject({
      status: 'pending',
      fetchStatus: 'fetching',
      fetchFailureCount: 0,
      errorUpdateCount: 1,
    })
    expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent('A cost estimate is unavailable.')
  } finally {
    finishRefetch()
    unmount()
    queryClient.clear()
  }
})
