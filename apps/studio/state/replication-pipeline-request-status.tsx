import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { createContext, useContext, useState, type ReactNode } from 'react'

import { replicationPipelineStatusQueryOptions } from '@/data/replication/pipeline-status-query'

export enum PipelineStatusRequestStatus {
  None = 'None',
  StartRequested = 'StartRequested',
  StopRequested = 'StopRequested',
}

type PipelineRequest = {
  id: symbol
  status: PipelineStatusRequestStatus
}

interface PipelineRequestStatusContextType {
  getRequestStatus: (pipelineId: number) => PipelineStatusRequestStatus
  isRequestPending: (pipelineId: number) => boolean
  runWithRequestStatus: <T>(
    pipelineId: number,
    status: PipelineStatusRequestStatus,
    action: () => Promise<T>
  ) => Promise<T>
}

const PipelineRequestStatusContext = createContext<PipelineRequestStatusContextType | undefined>(
  undefined
)

export const PipelineRequestStatusProvider = ({ children }: { children: ReactNode }) => {
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()
  const [requests, setRequests] = useState<Record<number, PipelineRequest>>({})

  const runWithRequestStatus: PipelineRequestStatusContextType['runWithRequestStatus'] = async (
    pipelineId,
    status,
    action
  ) => {
    const id = Symbol('pipeline request')
    setRequests((previous) => ({ ...previous, [pipelineId]: { id, status } }))
    try {
      return await action()
    } finally {
      const options = {
        ...replicationPipelineStatusQueryOptions({ projectRef, pipelineId }),
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
        if (previous[pipelineId]?.id !== id) return previous
        const { [pipelineId]: _removed, ...rest } = previous
        return rest
      })
    }
  }

  return (
    <PipelineRequestStatusContext.Provider
      value={{
        getRequestStatus: (pipelineId) =>
          requests[pipelineId]?.status ?? PipelineStatusRequestStatus.None,
        isRequestPending: (pipelineId) => requests[pipelineId] !== undefined,
        runWithRequestStatus,
      }}
    >
      {children}
    </PipelineRequestStatusContext.Provider>
  )
}

export const usePipelineRequestStatus = () => {
  const context = useContext(PipelineRequestStatusContext)
  if (context === undefined)
    throw new Error('usePipelineRequestStatus must be used within a PipelineRequestStatusProvider')
  return context
}
