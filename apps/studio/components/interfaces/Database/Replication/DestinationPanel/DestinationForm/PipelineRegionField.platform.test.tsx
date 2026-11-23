import { screen } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'

import { PipelineRegionField } from './PipelineRegionField'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

test('shows the API default region as read-only information', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/regions',
    response: () =>
      HttpResponse.json<platformComponents['schemas']['PipelineRegionsResponse_Output']>({
        default_cluster_id: 'asia-cluster-a',
        regions: [
          {
            cluster_id: 'asia-cluster-a',
            region_code: 'ap-south-1',
            region_name: 'South Asia (Mumbai)',
          },
        ],
      }),
  })

  customRender(<PipelineRegionField />)

  expect(await screen.findByText('South Asia (Mumbai)')).toBeInTheDocument()
  expect(screen.getByText('ap-south-1')).toBeInTheDocument()
  expect(screen.queryByRole('combobox')).toBeNull()
})
