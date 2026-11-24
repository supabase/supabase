import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'

import { useDatabaseReport } from './database-report-query'
import { projectKeys } from '@/data/projects/keys'
import { replicaKeys } from '@/data/read-replicas/keys'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

test('refresh loads updated database size data', async () => {
  let size = 100
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: () => HttpResponse.json<{ size: number }[]>([{ size }]),
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  queryClient.setQueryData(projectKeys.detail('default'), {
    ref: 'default',
    connectionString: 'postgresql://test:password@localhost:5432/postgres',
  })
  queryClient.setQueryData(replicaKeys.list('default'), [])
  const { result } = customRenderHook(() => useDatabaseReport(), { queryClient })

  await waitFor(() => expect(result.current.data.largeObjects).toEqual([{ size: 100 }]))

  size = 200
  act(() => {
    result.current.refresh()
  })

  await waitFor(() => expect(result.current.data.largeObjects).toEqual([{ size: 200 }]))
})
