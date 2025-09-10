import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
} from 'react'

export enum PipelineStatusRequestStatus {
  None = 'None',
  StartRequested = 'StartRequested',
  StopRequested = 'StopRequested',
  RestartRequested = 'RestartRequested',
}

interface PipelineRequestStatusContextType {
  requestStatus: Record<number, PipelineStatusRequestStatus>
  pipelineStatusSnapshot: Record<number, string | undefined>
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
  const [pipelineStatusSnapshot, setPipelineStatusSnapshot] = useState<
    Record<number, string | undefined>
  >({})
  const timeoutsRef = useRef<Record<number, number>>({})
  const REQUEST_TIMEOUT_MS = 10_000

  const setRequestStatus = (
    pipelineId: number,
    status: PipelineStatusRequestStatus,
    snapshotStatus?: string
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
      if (snapshotStatus !== undefined) {
        return { ...prev, [pipelineId]: snapshotStatus }
      }
      return prev
    })

    // Clear existing timeout for this pipeline
    const existing = timeoutsRef.current[pipelineId]
    if (existing !== undefined) {
      clearTimeout(existing)
      delete timeoutsRef.current[pipelineId]
    }

    // Start auto-reset timer for non-None states
    if (status !== PipelineStatusRequestStatus.None) {
      const id = window.setTimeout(() => {
        // If still pending, clear to None to show backend state
        setRequestStatusState((prev) => {
          if (prev[pipelineId] && prev[pipelineId] !== PipelineStatusRequestStatus.None) {
            return { ...prev, [pipelineId]: PipelineStatusRequestStatus.None }
          }
          return prev
        })
        setPipelineStatusSnapshot((prev) => {
          const { [pipelineId]: _omit, ...rest } = prev
          return rest
        })
        delete timeoutsRef.current[pipelineId]
      }, REQUEST_TIMEOUT_MS)
      timeoutsRef.current[pipelineId] = id
    }
  }

  const getRequestStatus = (pipelineId: number): PipelineStatusRequestStatus => {
    return requestStatus[pipelineId] || PipelineStatusRequestStatus.None
  }

  const updatePipelineStatus = useCallback(
    (pipelineId: number, newStatus: string | undefined) => {
      const currentRequestStatus = requestStatus[pipelineId] || PipelineStatusRequestStatus.None
      if (currentRequestStatus === PipelineStatusRequestStatus.None) return

      // Only remove when backend status differs from snapshot
      const snapshotStatus = pipelineStatusSnapshot[pipelineId]
      if (newStatus !== snapshotStatus) {
        setRequestStatus(pipelineId, PipelineStatusRequestStatus.None)
      }
    },
    [requestStatus, pipelineStatusSnapshot]
  )

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((id) => clearTimeout(id))
      timeoutsRef.current = {}
    }
  }, [])

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
