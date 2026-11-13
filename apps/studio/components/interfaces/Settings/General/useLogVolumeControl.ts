import { LOCAL_STORAGE_KEYS } from 'common'
import { z } from 'zod'

import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const LOG_VOLUME_CONTROL_VALUES = ['all', 'errors_only'] as const
export type LogVolumeControl = (typeof LOG_VOLUME_CONTROL_VALUES)[number]

const logVolumeControlSchema = z.enum(LOG_VOLUME_CONTROL_VALUES)

// TODO(DEBUG-266): UI-only until the backend supports filtering by log volume control, see the RFC: Log Volume Control project in Linear.
export const useLogVolumeControl = (projectRef?: string) => {
  const [storedValue, setLogVolumeControl, { isLoading }] = useLocalStorageQuery<LogVolumeControl>(
    LOCAL_STORAGE_KEYS.LOG_VOLUME_CONTROL(projectRef ?? '_'),
    'all'
  )
  const parsed = logVolumeControlSchema.safeParse(storedValue)
  const logVolumeControl: LogVolumeControl = parsed.success ? parsed.data : 'all'
  return { logVolumeControl, setLogVolumeControl, isLoading }
}
