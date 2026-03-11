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
    const allModes: { id: ConnectMode; enabled: boolean }[] = [
      { id: 'framework', enabled: showAppFrameworks || showMobileFrameworks },
      { id: 'direct', enabled: true },
      { id: 'orm', enabled: showOrms },
      { id: 'mcp', enabled: true },
    ]
    return allModes.filter((m) => m.enabled).map((m) => m.id)
  }, [showAppFrameworks, showMobileFrameworks, showOrms])
}
