import { QueryClient } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'

import { useCreateDestinationPipelineMutation } from './create-destination-pipeline-mutation'
import { useReplicationDestinationsQuery } from './destinations-query'
import { useReplicationPipelinesQuery } from './pipelines-query'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type Destination = components['schemas']['DestinationsResponse_Output']['destinations'][number]
type Pipeline = components['schemas']['PipelinesResponse_Output']['pipelines'][number]

const destination: Destination = {
  id: 7,
  name: 'Warehouse',
  tenant_id: 'tenant',
  config: { big_query: { project_id: 'warehouse', dataset_id: 'analytics' } },
}
const pipeline: Pipeline = {
  id: '8',
  destination_id: 7,
  destination_name: 'Warehouse',
  source_id: 1,
  source_name: 'default',
  tenant_id: 'tenant',
  replicator_id: 9,
  config: { publication_name: 'analytics' },
}

// Regression: lists were mounted with `refetchOnMount: false`, so after creating a pipeline
// elsewhere, returning to the (unmounted) list page kept showing the stale cache.
test('shows a newly created pipeline when returning to the list page', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })

  let hasCreated = false
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations',
    response: () =>
      HttpResponse.json<components['schemas']['DestinationsResponse_Output']>({
        destinations: hasCreated ? [destination] : [],
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: () =>
      HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({
        pipelines: hasCreated ? [pipeline] : [],
      }),
  })
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/destinations-pipelines',
    response: () => {
      hasCreated = true
      return HttpResponse.json<components['schemas']['CreateDestinationPipelineResponse_Output']>({
        destination_id: 7,
        pipeline_id: '8',
      })
    },
  })

  const useLists = () => ({
    destinations: useReplicationDestinationsQuery({ projectRef: 'default' }),
    pipelines: useReplicationPipelinesQuery({ projectRef: 'default' }),
  })

  // Visit the list page while it's empty, then navigate away
  const listPage = customRenderHook(useLists, { queryClient })
  await waitFor(() => {
    expect(listPage.result.current.destinations.data?.destinations).toEqual([])
    expect(listPage.result.current.pipelines.data?.pipelines).toEqual([])
  })
  listPage.unmount()

  // Create a pipeline from another page
  const createPage = customRenderHook(() => useCreateDestinationPipelineMutation(), {
    queryClient,
  })
  await createPage.result.current.mutateAsync({
    projectRef: 'default',
    destinationName: 'Warehouse',
    destinationConfig: {
      bigQuery: { projectId: 'warehouse', datasetId: 'analytics', serviceAccountKey: '{}' },
    },
    sourceId: 1,
    pipelineConfig: { publicationName: 'analytics', tableSyncCopy: { type: 'include_all_tables' } },
  })
  createPage.unmount()

  // Return to the list page
  const returnedPage = customRenderHook(useLists, { queryClient })
  await waitFor(() => {
    expect(returnedPage.result.current.destinations.data?.destinations).toEqual([destination])
    expect(returnedPage.result.current.pipelines.data?.pipelines).toEqual([pipeline])
  })
})
