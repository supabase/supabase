import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { describe, expect, test, vi } from 'vitest'

import { invalidateReplicationPipelineQueries } from './invalidate-pipeline-queries'
import { replicationKeys } from './keys'

describe('pipeline cache invalidation', () => {
  test.each([
    { key: replicationKeys.pipelines('default'), shouldReplaceRead: true },
    { key: replicationKeys.pipelineById('default', 1), shouldReplaceRead: true },
    { key: replicationKeys.pipelinesVersion('default', 1), shouldReplaceRead: true },
    { key: replicationKeys.pipelinesStatus('default', 1), shouldReplaceRead: false },
    { key: replicationKeys.pipelinesReplicationStatus('default', 1), shouldReplaceRead: false },
  ])('refreshes metadata while sharing polls: $key', async ({ key, shouldReplaceRead }) => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(key, 'cached')
    let completeOldRead!: (value: string) => void
    const oldRead = new Promise<string>((resolve) => {
      completeOldRead = resolve
    })
    const aborted = vi.fn()
    const queryFn = vi.fn(({ signal }: { signal: AbortSignal }) => {
      signal.addEventListener('abort', aborted)
      return queryFn.mock.calls.length === 1 ? oldRead : Promise.resolve('saved')
    })
    const observer = new QueryObserver(queryClient, { queryKey: key, queryFn })
    const unsubscribe = observer.subscribe(() => {})
    try {
      const refresh = invalidateReplicationPipelineQueries(queryClient, 'default')
      completeOldRead('before mutation')
      await refresh

      expect(queryClient.getQueryData(key)).toBe(shouldReplaceRead ? 'saved' : 'before mutation')
      expect(queryFn).toHaveBeenCalledTimes(shouldReplaceRead ? 2 : 1)
      expect(aborted).toHaveBeenCalledTimes(shouldReplaceRead ? 1 : 0)
    } finally {
      unsubscribe()
      queryClient.clear()
    }
  })
})
