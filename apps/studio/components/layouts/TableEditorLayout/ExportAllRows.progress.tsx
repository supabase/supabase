import { useCallback, useRef, type ReactNode } from 'react'
import { toast } from 'sonner'
import { SonnerProgress } from 'ui'

export const useProgressToasts = () => {
  const toastIdsRef = useRef(new Map<number, string | number>())

  const startProgressTracker = useCallback(
    ({
      id,
      name,
      trackPercentage = false,
    }: {
      id: number
      name: string
      trackPercentage?: boolean
    }) => {
      if (toastIdsRef.current.has(id)) return

      if (trackPercentage) {
        toastIdsRef.current.set(
          id,
          toast(<SonnerProgress progress={0} message={`Exporting ${name}...`} />, {
            closeButton: false,
            duration: Infinity,
          })
        )
      } else {
        toastIdsRef.current.set(id, toast.loading(`Exporting ${name}...`))
      }
    },
    []
  )

  const trackPercentageProgress = useCallback(
    ({
      id,
      name,
      value,
      totalRows,
    }: {
      id: number
      name: string
      value: number
      totalRows: number
    }) => {
      const savedToastId = toastIdsRef.current.get(id)

      const progress = Math.min((value / totalRows) * 100, 100)
      const newToastId = toast(
        <SonnerProgress progress={progress} message={`Exporting ${name}...`} />,
        {
          id: savedToastId,
          closeButton: false,
          duration: Infinity,
        }
      )

      if (!savedToastId) toastIdsRef.current.set(id, newToastId)
    },
    []
  )

  const stopTrackerWithError = useCallback(
    (id: number, name: string, customMessage?: ReactNode) => {
      const savedToastId = toastIdsRef.current.get(id)
      if (savedToastId) {
        toast.dismiss(savedToastId)
        toastIdsRef.current.delete(id)
      }

      toast.error(customMessage ?? `There was an error exporting ${name}`)
    },
    []
  )

  const dismissTrackerSilently = useCallback((id: number) => {
    const savedToastId = toastIdsRef.current.get(id)
    if (savedToastId) {
      toast.dismiss(savedToastId)
      toastIdsRef.current.delete(id)
    }
  }, [])

  const markTrackerComplete = useCallback((id: number, totalRows: number) => {
    const savedToastId = toastIdsRef.current.get(id)
    const deleteSavedToastId = () => toastIdsRef.current.delete(id)

    toast.success(`Successfully exported ${totalRows} rows`, {
      id: savedToastId,
      duration: 4000,
      onAutoClose: deleteSavedToastId,
      onDismiss: deleteSavedToastId,
    })
  }, [])

  return {
    startProgressTracker,
    trackPercentageProgress,
    stopTrackerWithError,
    dismissTrackerSilently,
    markTrackerComplete,
  }
}
