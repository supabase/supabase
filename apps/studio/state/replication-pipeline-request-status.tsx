import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { createContext, useContext, useState, type ReactNode } from 'react'

import { replicationPipelineStatusQueryOptions } from '@/data/replication/pipeline-status-query'

export enum PipelineStatusRequestStatus {
  None = 'None',
  StartRequested = 'StartRequested',
  StopRequested = 'StopRequested',
}

const requestKey = (pipelineId: string, clusterId?: string) =>
  JSON.stringify([clusterId ?? null, pipelineId])

type PipelineRequest = {
  id: symbol
  status: PipelineStatusRequestStatus
}

interface PipelineRequestStatusContextType {
  getRequestStatus: (
    pipelineId: string | undefined,
    clusterId?: string
  ) => PipelineStatusRequestStatus
  isRequestPending: (pipelineId: string | undefined, clusterId?: string) => boolean
  runWithRequestStatus: <T>(
    pipelineId: string,
    status: PipelineStatusRequestStatus,
    action: () => Promise<T>,
    clusterId?: string
  ) => Promise<T>
}

const PipelineRequestStatusContext = createContext<PipelineRequestStatusContextType | undefined>(
  undefined
)

export const PipelineRequestStatusProvider = ({ children }: { children: ReactNode }) => {
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()
  const [requests, setRequests] = useState<Record<string, PipelineRequest>>({})

  const runWithRequestStatus: PipelineRequestStatusContextType['runWithRequestStatus'] = async (
    pipelineId,
    status,
    action,
    clusterId
  ) => {
    const id = Symbol('pipeline request')
    const key = requestKey(pipelineId, clusterId)
    setRequests((previous) => ({ ...previous, [key]: { id, status } }))
    try {
      return await action()
    } finally {
      const options = {
        ...replicationPipelineStatusQueryOptions({ projectRef, pipelineId, clusterId }),
        staleTime: 0,
      }
      // A status fetch that was already in flight started before this mutation resolved, so it
      // may resolve with pre-mutation data. `fetchQuery` dedupes against it instead of starting
      // a new request, so first wait for it to drain.
      const hasFetchInFlight =
        queryClient.getQueryState(options.queryKey)?.fetchStatus === 'fetching'
      if (hasFetchInFlight) await queryClient.fetchQuery(options).catch(() => {})

      // Nothing is in flight now, so this always starts a fresh request reflecting the
      // post-mutation state. Errors are swallowed: query consumers already display fetch
      // failures, and we don't want that to override the mutation's own result/error.
      await queryClient.fetchQuery(options).catch(() => {})

      setRequests((previous) => {
        if (previous[key]?.id !== id) return previous
        const { [key]: _removed, ...rest } = previous
        return rest
      })
    }
  }

  return (
    <PipelineRequestStatusContext.Provider
      value={{
        getRequestStatus: (pipelineId, clusterId) =>
          (pipelineId === undefined
            ? undefined
            : requests[requestKey(pipelineId, clusterId)]?.status) ??
          PipelineStatusRequestStatus.None,
        isRequestPending: (pipelineId, clusterId) =>
          pipelineId !== undefined && requests[requestKey(pipelineId, clusterId)] !== undefined,
        runWithRequestStatus,
      }}
    >
      {children}
    </PipelineRequestStatusContext.Provider>
  )
}

/**
 * Request statuses are shared across clusters; refreshes target the caller's cluster.
 * If clusterId is undefined, it just means the default cluster
 * */
export const usePipelineRequestStatus = ({ clusterId }: { clusterId?: string } = {}) => {
  const context = useContext(PipelineRequestStatusContext)
  if (context === undefined)
    throw new Error('usePipelineRequestStatus must be used within a PipelineRequestStatusProvider')
  return {
    getRequestStatus: (pipelineId: string | undefined) =>
      context.getRequestStatus(pipelineId, clusterId),
    isRequestPending: (pipelineId: string | undefined) =>
      context.isRequestPending(pipelineId, clusterId),
    runWithRequestStatus: <T,>(
      pipelineId: string,
      status: PipelineStatusRequestStatus,
      action: () => Promise<T>
    ) => context.runWithRequestStatus(pipelineId, status, action, clusterId),
  }
}
