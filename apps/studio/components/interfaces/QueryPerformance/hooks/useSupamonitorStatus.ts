import { useSupamonitorEnabledQuery } from 'data/database/supamonitor-enabled-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

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
