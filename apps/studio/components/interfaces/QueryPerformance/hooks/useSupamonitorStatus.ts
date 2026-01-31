import { useSupamonitorEnabledQuery } from 'data/database/supamonitor-enabled-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

/**
 * Hook to check if supamonitor is enabled in shared_preload_libraries
 */
export function useSupamonitorStatus() {
  const { data: project } = useSelectedProjectQuery()
  const { data: isSupamonitorEnabled, isLoading } = useSupamonitorEnabledQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  return {
    isSupamonitorEnabled: isSupamonitorEnabled ?? false,
    isLoading,
  }
}
