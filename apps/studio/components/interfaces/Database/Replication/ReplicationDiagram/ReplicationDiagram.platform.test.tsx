import { screen } from '@testing-library/react'
import type { platformComponents as components } from 'api-types'
import { mockResizeObserver } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { afterEach, expect, test, vi } from 'vitest'

import { ReplicationDiagram } from '.'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

const resizeObserver = mockResizeObserver()

afterEach(() => vi.unstubAllGlobals())

function measureDiagram() {
  const elements = resizeObserver.getObservedElements()
  for (const element of elements) {
    Object.defineProperties(element, {
      offsetWidth: { configurable: true, value: 300 },
      offsetHeight: { configurable: true, value: 80 },
    })
    resizeObserver.mockElementSize(element, {
      contentBoxSize: { inlineSize: 300, blockSize: 80 },
    })
  }
  resizeObserver.resize(elements)
}

test('draws destinations as their regions load and keeps the primary database in its project region', async () => {
  vi.stubGlobal(
    'DOMMatrixReadOnly',
    class {
      readonly m22 = 1
    }
  )
  mockProjectGrantContext({ ref: 'default' })

  addAPIMock({
    method: 'get',
    path: '/platform/replication/regions',
    response: () =>
      HttpResponse.json<components['schemas']['PipelineRegionsResponse_Output']>({
        default_cluster_id: '1',
        regions: [
          { cluster_id: '1', region_code: 'ap-southeast-1', region_name: 'Singapore' },
          { cluster_id: '2', region_code: 'eu-central-1', region_name: 'Frankfurt' },
        ],
      }),
  })
  const secondRegion = Promise.withResolvers<void>()
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations',
    response: async ({ request }) => {
      const clusterId = new URL(request.url).searchParams.get('cluster_id')
      if (clusterId === '2') await secondRegion.promise
      else if (clusterId !== null)
        return HttpResponse.json<APIErrorBody>({ message: 'Unknown cluster' }, { status: 404 })

      return HttpResponse.json<components['schemas']['DestinationsResponse_Output']>({
        destinations: [
          {
            id: 7,
            name: clusterId === null ? 'Warehouse A' : 'Warehouse B',
            tenant_id: 'default',
            config: {
              big_query: {
                connection_pool_size: 8,
                dataset_id: 'analytics',
                project_id: 'example-project',
              },
            },
          },
        ],
      })
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: () =>
      HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({ pipelines: [] }),
  })

  customRender(
    <ReplicationClusterProvider clusterId="2">
      <PipelineRequestStatusProvider>
        <ReplicationDiagram />
      </PipelineRequestStatusProvider>
    </ReplicationClusterProvider>
  )

  try {
    expect(await screen.findByText('Warehouse A')).toBeInTheDocument()
    measureDiagram()
    expect(await screen.findByText('Singapore')).toBeInTheDocument()
    expect(await screen.findByText('East US (North Virginia)')).toBeInTheDocument()
    expect(screen.queryByText('Warehouse B')).not.toBeInTheDocument()
  } finally {
    secondRegion.resolve()
  }

  expect(await screen.findByText('Warehouse B')).toBeInTheDocument()
  measureDiagram()
  expect(await screen.findByText('Frankfurt')).toBeInTheDocument()
  expect(screen.getByText('Warehouse A')).toBeInTheDocument()
  expect(screen.getAllByText('Pipeline region:')).toHaveLength(2)
})
