import type { ConnectMode } from './Connect.types'

export function shouldFetchDataApiConfig({ mode }: { mode: ConnectMode }): boolean {
  return mode === 'framework'
}

export function shouldShowDataApiDisabledWarning({
  mode,
  isDataApiEnabled,
  isPending,
  isError,
}: {
  mode: ConnectMode
  isDataApiEnabled: boolean
  isPending: boolean
  isError: boolean
}): boolean {
  if (isPending || isError || isDataApiEnabled) return false
  return shouldFetchDataApiConfig({ mode })
}
