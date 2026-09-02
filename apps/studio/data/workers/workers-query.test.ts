import { focusManager, QueryClient, useQuery } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { workersQueryOptions } from './workers-query'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ListWorkersResponse = components['schemas']['V2ListWorkersResponse_Output']
type WorkerDatum = ListWorkersResponse['data'][number]

const workerDatum = (id: string): WorkerDatum => ({
  id,
  type: 'project_worker' as const,
  attributes: {
    build_state: 'active' as const,
    secret_generation: '1',
    spec: { exposure: 'public', instances: 1, runtime: 'node', size: '2gb-1vcpu' },
  },
})

describe('workersQueryOptions', () => {
  it('refreshes whenever the browser regains focus', async () => {
    const responses = [[], [workerDatum('embed')]]
    let requestCount = 0
    addAPIMock({
      method: 'get',
      path: '/v2/projects/:ref/workers',
      response: () => HttpResponse.json({ data: responses[requestCount++] }),
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = customRenderHook(
      () =>
        useQuery({
          ...workersQueryOptions({ projectRef: 'default' }),
          enabled: true,
          staleTime: Infinity,
        }),
      { queryClient }
    )

    await waitFor(() => expect(result.current.data).toEqual([]))

    focusManager.setFocused(false)
    focusManager.setFocused(true)

    await waitFor(() =>
      expect(result.current.data?.map((worker) => worker.name)).toEqual(['embed'])
    )
  })
})
