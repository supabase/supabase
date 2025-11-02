import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

export enum PipelineStatusRequestStatus {
  None = 'None',
  EnableRequested = 'EnableRequested',
  DisableRequested = 'DisableRequested',
}

interface PipelineRequestStatusContextType {
  requestStatus: Record<number, PipelineStatusRequestStatus>
  setRequestStatus: (pipelineId: number, status: PipelineStatusRequestStatus) => void
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

  const setRequestStatus = (pipelineId: number, status: PipelineStatusRequestStatus) => {
    setRequestStatusState((prev) => ({
      ...prev,
      [pipelineId]: status,
    }))
  }

  const getRequestStatus = (pipelineId: number): PipelineStatusRequestStatus => {
    return requestStatus[pipelineId] || PipelineStatusRequestStatus.None
  }

  const updatePipelineStatus = useCallback(
    (pipelineId: number, backendStatus: string | undefined) => {
      const currentRequestStatus = requestStatus[pipelineId] || PipelineStatusRequestStatus.None

      if (
        (currentRequestStatus === PipelineStatusRequestStatus.EnableRequested &&
          (backendStatus === 'started' || backendStatus === 'failed')) ||
        (currentRequestStatus === PipelineStatusRequestStatus.DisableRequested &&
          (backendStatus === 'stopped' || backendStatus === 'failed'))
      ) {
        setRequestStatus(pipelineId, PipelineStatusRequestStatus.None)
      }
    },
    [requestStatus, setRequestStatus]
  )

  return (
    <PipelineRequestStatusContext.Provider
      value={{
        requestStatus,
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
