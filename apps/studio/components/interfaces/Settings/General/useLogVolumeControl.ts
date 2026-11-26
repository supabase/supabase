import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { logSettingsQueryOptions } from '@/data/log-settings/log-settings-query'
import { useLogSettingsUpdateMutation } from '@/data/log-settings/log-settings-update-mutation'

export const LOG_VOLUME_CONTROL_VALUES = ['all', 'errors_only'] as const
export type LogVolumeControl = (typeof LOG_VOLUME_CONTROL_VALUES)[number]

const logVolumeControlSchema = z.enum(LOG_VOLUME_CONTROL_VALUES)

export const useLogVolumeControl = (projectRef?: string) => {
  const { data, isLoading, isError, error } = useQuery(logSettingsQueryOptions({ projectRef }))
  const { mutate, isPending: isSaving } = useLogSettingsUpdateMutation()

  const parsed = logVolumeControlSchema.safeParse(data?.debug_mode)
  const logVolumeControl: LogVolumeControl = parsed.success ? parsed.data : 'all'

  const setLogVolumeControl = (value: LogVolumeControl, onSuccess?: () => void) => {
    if (!projectRef) return
    mutate({ projectRef, payload: { debug_mode: value } }, { onSuccess })
  }

  return { logVolumeControl, setLogVolumeControl, isLoading, isSaving, isError, error }
}
