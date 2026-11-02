import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'

import { useCreateDestinationPipelineMutation } from './create-destination-pipeline-mutation'
import { useReplicationDestinationsQuery } from './destinations-query'
import { useReplicationPipelinesQuery } from './pipelines-query'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

test('refreshes both lists when returning after creating a pipeline on another page', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  const destination: components['schemas']['DestinationsResponse_Output']['destinations'][number] =
    {
      id: 7,
      name: 'Warehouse',
      tenant_id: 'tenant',
      config: { big_query: { project_id: 'warehouse', dataset_id: 'analytics' } },
    }
  const pipeline: components['schemas']['PipelinesResponse_Output']['pipelines'][number] = {
    id: '8',
    destination_id: 7,
    destination_name: 'Warehouse',
    source_id: 1,
    source_name: 'default',
    tenant_id: 'tenant',
    replicator_id: 9,
    config: { publication_name: 'analytics' },
  }
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
  const initialList = customRenderHook(useLists, { queryClient })
  await waitFor(() => {
    expect(initialList.result.current.destinations.data).toEqual({ destinations: [] })
    expect(initialList.result.current.pipelines.data).toEqual({ pipelines: [] })
  })
  initialList.unmount()

  const creation = customRenderHook(() => useCreateDestinationPipelineMutation(), { queryClient })
  await act(async () => {
    await creation.result.current.mutateAsync({
      projectRef: 'default',
      destinationName: 'Warehouse',
      destinationConfig: {
        bigQuery: { projectId: 'warehouse', datasetId: 'analytics', serviceAccountKey: '{}' },
      },
      sourceId: 1,
      pipelineConfig: {
        publicationName: 'analytics',
        tableSyncCopy: { type: 'include_all_tables' },
      },
    })
  })
  creation.unmount()

  const returnedList = customRenderHook(useLists, { queryClient })
  try {
    await waitFor(() => {
      expect(returnedList.result.current.destinations.isFetching).toBe(false)
      expect(returnedList.result.current.pipelines.isFetching).toBe(false)
    })
    expect(returnedList.result.current.destinations.data).toEqual({ destinations: [destination] })
    expect(returnedList.result.current.pipelines.data).toEqual({ pipelines: [pipeline] })
  } finally {
    returnedList.unmount()
    queryClient.clear()
  }
})
