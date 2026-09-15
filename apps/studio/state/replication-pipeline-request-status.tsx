import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'

export enum PipelineStatusRequestStatus {
  None = 'None',
  StartRequested = 'StartRequested',
  StopRequested = 'StopRequested',
  RestartRequested = 'RestartRequested',
}

type PipelineRequest = {
  status: PipelineStatusRequestStatus
  snapshot?: string
  latestStatus?: string
  hasTransitioned: boolean
  isPending: boolean
}

const REQUEST_SETTLE_TIMEOUT_MS = 30_000

const hasCompleted = (request: PipelineRequest) => {
  if (request.isPending) return false
  if (request.status === PipelineStatusRequestStatus.StopRequested) {
    return request.latestStatus === 'stopped'
  }
  if (request.latestStatus !== 'started' && request.latestStatus !== 'failed') return false
  return request.latestStatus !== request.snapshot || request.hasTransitioned
}

interface PipelineRequestStatusContextType {
  getRequestStatus: (pipelineId: number) => PipelineStatusRequestStatus
  updatePipelineStatus: (pipelineId: number, backendStatus: string | undefined) => void
  runWithRequestStatus: <T>(
    pipelineId: number,
    status: PipelineStatusRequestStatus,
    snapshotStatus: string | undefined,
    action: () => Promise<T>
  ) => Promise<T>
}

const PipelineRequestStatusContext = createContext<PipelineRequestStatusContextType | undefined>(
  undefined
)

export const PipelineRequestStatusProvider = ({ children }: { children: ReactNode }) => {
  const [statuses, setStatuses] = useState<Record<number, PipelineStatusRequestStatus>>({})
  const requests = useRef<Record<number, PipelineRequest>>({})
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  const clearRequest = useCallback((pipelineId: number) => {
    clearTimeout(timers.current[pipelineId])
    delete timers.current[pipelineId]
    delete requests.current[pipelineId]
    setStatuses((previous) => {
      const { [pipelineId]: _removed, ...rest } = previous
      return rest
    })
  }, [])

  const awaitBackend = (pipelineId: number) => {
    // Start the fallback only after HTTP completion; slow requests remain visibly pending.
    timers.current[pipelineId] = setTimeout(() => {
      clearRequest(pipelineId)
      toast.info('The pipeline update is taking longer than expected. Showing the latest status.')
    }, REQUEST_SETTLE_TIMEOUT_MS)
  }

  const beginRequest = (
    pipelineId: number,
    status: PipelineStatusRequestStatus,
    snapshot: string | undefined
  ) => {
    clearTimeout(timers.current[pipelineId])
    const request: PipelineRequest = { status, snapshot, isPending: true, hasTransitioned: false }
    requests.current[pipelineId] = request
    setStatuses((previous) => ({ ...previous, [pipelineId]: status }))
    return request
  }

  const runWithRequestStatus: PipelineRequestStatusContextType['runWithRequestStatus'] = async (
    pipelineId,
    status,
    snapshot,
    action
  ) => {
    const request = beginRequest(pipelineId, status, snapshot)
    try {
      const result = await action()
      if (requests.current[pipelineId] === request) {
        request.isPending = false
        if (hasCompleted(request)) clearRequest(pipelineId)
        else awaitBackend(pipelineId)
      }
      return result
    } catch (error) {
      if (requests.current[pipelineId] === request) clearRequest(pipelineId)
      throw error
    }
  }

  const updatePipelineStatus = useCallback(
    (pipelineId: number, backendStatus: string | undefined) => {
      const request = requests.current[pipelineId]
      if (!request || backendStatus === undefined) return
      request.latestStatus = backendStatus
      request.hasTransitioned ||= backendStatus !== request.snapshot
      // A restart passes through stopping/stopped/starting. Keep its intent until a final state.
      if (hasCompleted(request)) clearRequest(pipelineId)
    },
    [clearRequest]
  )

  useEffect(
    () => () => {
      Object.values(timers.current).forEach(clearTimeout)
      requests.current = {}
      timers.current = {}
    },
    []
  )

  return (
    <PipelineRequestStatusContext.Provider
      value={{
        getRequestStatus: (pipelineId) => statuses[pipelineId] ?? PipelineStatusRequestStatus.None,
        updatePipelineStatus,
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
