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
      // Mutations may finish while a status read from before their response is still in flight.
      // Let that read finish, then fetch once more so the handoff uses a post-operation read.
      // Keep metrics polling independently; never cancel or overlap status requests.
      if (queryClient.getQueryState(options.queryKey)?.fetchStatus === 'fetching') {
        await queryClient.fetchQuery(options).catch(() => {})
      }
      // Query consumers display refresh failures. Preserve the mutation's result or error.
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
