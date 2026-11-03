import { LOCAL_STORAGE_KEYS } from 'common'
import { z } from 'zod'

import { LOG_VISIBILITY_VALUES, type LogVisibility } from './UnifiedLogs.constants'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const logVisibilitySchema = z.enum(LOG_VISIBILITY_VALUES)

// TODO(DEBUG-266): stored per browser until the platform API supports a project-level setting.
export const useLogVisibility = (projectRef?: string) => {
  const [storedValue, setLogVisibility, { isLoading }] = useLocalStorageQuery<LogVisibility>(
    LOCAL_STORAGE_KEYS.LOG_VISIBILITY(projectRef ?? '_'),
    'all'
  )
  const parsed = logVisibilitySchema.safeParse(storedValue)
  const logVisibility: LogVisibility = parsed.success ? parsed.data : 'all'
  return { logVisibility, setLogVisibility, isLoading }
}
