import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export function useShowMicroUpgradeBadge() {
  const { data: project, isPending: isProjectLoading } = useSelectedProjectQuery()
  const { hasAccess: canUpdateCompute, isLoading: isEntitlementLoading } = useCheckEntitlements(
    'instances.compute_update_available_sizes'
  )

  const projectComputeSize = project?.infra_compute_size ?? 'nano'
  const showMicroUpgradeBadge = canUpdateCompute && projectComputeSize === 'nano'

  return {
    project,
    isProjectLoading,
    isEntitlementLoading,
    showMicroUpgradeBadge,
  }
}
