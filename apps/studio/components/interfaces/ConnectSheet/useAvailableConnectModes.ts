import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useMemo } from 'react'
import type { ConnectMode } from './Connect.types'

export function useAvailableConnectModes(): ConnectMode[] {
  const {
    projectConnectionShowAppFrameworks: showAppFrameworks,
    projectConnectionShowMobileFrameworks: showMobileFrameworks,
    projectConnectionShowOrms: showOrms,
  } = useIsFeatureEnabled([
    'project_connection:show_app_frameworks',
    'project_connection:show_mobile_frameworks',
    'project_connection:show_orms',
  ])

  return useMemo(() => {
    const modes: ConnectMode[] = []
    if (showAppFrameworks || showMobileFrameworks) modes.push('framework')
    modes.push('direct')
    if (showOrms) modes.push('orm')
    modes.push('mcp')
    return modes
  }, [showAppFrameworks, showMobileFrameworks, showOrms])
}
