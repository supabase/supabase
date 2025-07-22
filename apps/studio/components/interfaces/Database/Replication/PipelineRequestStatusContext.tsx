import { createContext, useContext, useState, ReactNode } from 'react'

export enum PipelineStatusRequestStatus {
  None = 'None',
  EnableRequested = 'EnableRequested',
  DisableRequested = 'DisableRequested',
}

interface PipelineRequestStatusContextType {
  requestStatus: Record<number, PipelineStatusRequestStatus>
  setRequestStatus: (pipelineId: number, status: PipelineStatusRequestStatus) => void
  getRequestStatus: (pipelineId: number) => PipelineStatusRequestStatus
}

const PipelineRequestStatusContext = createContext<PipelineRequestStatusContextType | undefined>(undefined)

interface PipelineRequestStatusProviderProps {
  children: ReactNode
}

export const PipelineRequestStatusProvider = ({ children }: PipelineRequestStatusProviderProps) => {
  const [requestStatus, setRequestStatusState] = useState<Record<number, PipelineStatusRequestStatus>>({})

  const setRequestStatus = (pipelineId: number, status: PipelineStatusRequestStatus) => {
    setRequestStatusState(prev => ({
      ...prev,
      [pipelineId]: status
    }))
  }

  const getRequestStatus = (pipelineId: number): PipelineStatusRequestStatus => {
    return requestStatus[pipelineId] || PipelineStatusRequestStatus.None
  }

  return (
    <PipelineRequestStatusContext.Provider
      value={{
        requestStatus,
        setRequestStatus,
        getRequestStatus,
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