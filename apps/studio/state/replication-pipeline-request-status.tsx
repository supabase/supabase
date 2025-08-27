import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

export enum PipelineStatusRequestStatus {
  None = 'None',
  EnableRequested = 'EnableRequested',
  DisableRequested = 'DisableRequested',
  UpdateRequested = 'UpdateRequested',
}

interface PipelineRequestStatusContextType {
  requestStatus: Record<number, PipelineStatusRequestStatus>
  pipelineStatusSnapshot: Record<number, string>
  setRequestStatus: (
    pipelineId: number,
    status: PipelineStatusRequestStatus,
    snapshotStatus?: string
  ) => void
  getRequestStatus: (pipelineId: number) => PipelineStatusRequestStatus
  updatePipelineStatus: (pipelineId: number, backendStatus: string | undefined) => void
}

interface PipelineRequestStatusProviderProps {
  children: ReactNode
}

const PipelineRequestStatusContext = createContext<PipelineRequestStatusContextType | undefined>(
  undefined
)

export const PipelineRequestStatusProvider = ({ children }: PipelineRequestStatusProviderProps) => {
  const [requestStatus, setRequestStatusState] = useState<
    Record<number, PipelineStatusRequestStatus>
  >({})
  const [pipelineStatusSnapshot, setPipelineStatusSnapshot] = useState<Record<number, string>>({})

  const setRequestStatus = (
    pipelineId: number,
    status: PipelineStatusRequestStatus,
    pipelineStatusSnapshot?: string
  ) => {
    setRequestStatusState((prev) => ({
      ...prev,
      [pipelineId]: status,
    }))
    setPipelineStatusSnapshot((prev) => {
      if (status === PipelineStatusRequestStatus.None) {
        const { [pipelineId]: _omit, ...rest } = prev
        return rest
      }
      // Only set snapshot when provided to avoid undefined entries
      if (pipelineStatusSnapshot !== undefined) {
        return { ...prev, [pipelineId]: pipelineStatusSnapshot }
      }
      return prev
    })
  }

  const getRequestStatus = (pipelineId: number): PipelineStatusRequestStatus => {
    return requestStatus[pipelineId] || PipelineStatusRequestStatus.None
  }

  const updatePipelineStatus = useCallback(
    (pipelineId: number, backendStatus: string | undefined) => {
      const currentRequestStatus = requestStatus[pipelineId] || PipelineStatusRequestStatus.None
      if (currentRequestStatus === PipelineStatusRequestStatus.None) return

      const snapshot = pipelineStatusSnapshot[pipelineId]
      if (backendStatus !== undefined && backendStatus !== snapshot) {
        setRequestStatus(pipelineId, PipelineStatusRequestStatus.None)
      }
    },
    [requestStatus, pipelineStatusSnapshot, setRequestStatus]
  )

  return (
    <PipelineRequestStatusContext.Provider
      value={{
        requestStatus,
        pipelineStatusSnapshot,
        setRequestStatus,
        getRequestStatus,
        updatePipelineStatus,
      }}
    >
      {children}
    </PipelineRequestStatusContext.Provider>
  )
}

export const usePipelineRequestStatus = () => {
  const context = useContext(PipelineRequestStatusContext)
  if (context === undefined) {
    throw new Error('usePipelineRequestStatus must be used within a PipelineRequestStatusProvider')
  }
  return context
}
