import { hashKey, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { replicationKeys } from '@/data/replication/keys'

export enum PipelineStatusRequestStatus {
  None = 'None',
  StartRequested = 'StartRequested',
  StopRequested = 'StopRequested',
}

type PipelineRequest = {
  id: symbol
  status: PipelineStatusRequestStatus
  isPending: boolean
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

  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.type !== 'updated') return
        // Only network results end the optimistic display, not cached data or invalidation.
        if (
          event.action.type !== 'error' &&
          (event.action.type !== 'success' || event.action.manual)
        )
          return

        setRequests((previous) => {
          const entry = Object.entries(previous).find(
            ([pipelineId]) =>
              event.query.queryHash ===
              hashKey(replicationKeys.pipelinesStatus(projectRef, Number(pipelineId)))
          )
          if (!entry) return previous
          const [pipelineId, request] = entry
          if (!request.isPending) {
            const { [Number(pipelineId)]: _removed, ...rest } = previous
            return rest
          }
          if (request.status === PipelineStatusRequestStatus.None) return previous
          return {
            ...previous,
            [pipelineId]: { ...request, status: PipelineStatusRequestStatus.None },
          }
        })
      }),
    [projectRef, queryClient]
  )

  const runWithRequestStatus: PipelineRequestStatusContextType['runWithRequestStatus'] = async (
    pipelineId,
    status,
    action
  ) => {
    const id = Symbol('pipeline request')
    setRequests((previous) => ({ ...previous, [pipelineId]: { id, status, isPending: true } }))
    let hasSucceeded = false
    try {
      const result = await action()
      hasSucceeded = true
      return result
    } finally {
      setRequests((previous) => {
        const request = previous[pipelineId]
        if (request?.id !== id) return previous
        if (!hasSucceeded || request.status === PipelineStatusRequestStatus.None) {
          const { [pipelineId]: _removed, ...rest } = previous
          return rest
        }
        return { ...previous, [pipelineId]: { ...request, isPending: false } }
      })
    }
  }

  return (
    <PipelineRequestStatusContext.Provider
      value={{
        getRequestStatus: (pipelineId) =>
          requests[pipelineId]?.status ?? PipelineStatusRequestStatus.None,
        isRequestPending: (pipelineId) => requests[pipelineId]?.isPending ?? false,
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
