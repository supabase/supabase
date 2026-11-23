import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'

import { useReplicationCostEstimateQuery } from './cost-estimate-query'
import { useCreatePublicationMutation } from './publication-create-mutation'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

test('refreshes the project cost estimate when replacing a publication from another cluster', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  const publication = { projectRef: 'default', sourceId: 7, publicationName: 'analytics' }
  const table = { id: 42, name: 'events', schema: 'public' }
  const clusterId = 'eu-west-1'
  let hasReplacedPublication = false

  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources/:source_id/publications/:publication_name/cost-estimate',
    response: () =>
      HttpResponse.json<components['schemas']['CostEstimateResponse_Output']>({
        currency: 'usd',
        pipeline: { hourly_cost: 0.053, monthly_cost: 38.69 },
        streaming: { rate_per_gb: 3 },
        table_copy: {
          rate_per_gb: 0.6,
          total_bytes: hasReplacedPublication ? 10000 : 0,
          total_cost: 0,
          tables: hasReplacedPublication
            ? [{ ...table, estimated_bytes: 10000, estimated_cost: 0, is_row_filtered: false }]
            : [],
        },
      }),
  })
  addAPIMock({
    method: 'put',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
    response: ({ request }) => {
      hasReplacedPublication = new URL(request.url).searchParams.get('cluster_id') === clusterId
      return HttpResponse.json<components['schemas']['PublicationDetailsResponse_Output']>({
        name: publication.publicationName,
        config: {
          type: 'tables',
          operations: ['insert', 'update', 'delete', 'truncate'],
          publish_via_partition_root: true,
          tables: [{ ...table, columns: null, row_filter: null }],
        },
        tables: [{ ...table, kind: 'table', partition_parent_id: null }],
      })
    },
  })

  const { result } = customRenderHook(
    () => ({
      estimate: useReplicationCostEstimateQuery(publication),
      replacePublication: useCreatePublicationMutation(),
    }),
    { queryClient }
  )

  await waitFor(() => expect(result.current.estimate.data?.table_copy.tables).toEqual([]))
  await act(() =>
    result.current.replacePublication.mutateAsync({
      projectRef: publication.projectRef,
      sourceId: publication.sourceId,
      name: publication.publicationName,
      tableIds: [table.id],
      clusterId,
    })
  )
  await waitFor(() =>
    expect(result.current.estimate.data?.table_copy.tables).toMatchObject([{ name: 'events' }])
  )
})
