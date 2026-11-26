import { isEligibleForFreeMicroUpgrade } from '../../Support/FreeMicroUpgradeSuggestion.utils'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export function useShowMicroUpgradeBadge() {
  const { data: project, isPending: isLoadingProject } = useSelectedProjectQuery()
  const { hasAccess: canUpdateCompute, isLoading: isEntitlementLoading } = useCheckEntitlements(
    'instances.compute_update_available_sizes'
  )
  const { data: organization, isPending: isLoadingOrganization } = useSelectedOrganizationQuery()

  const projectComputeSize = project?.infra_compute_size ?? 'nano'
  const showMicroUpgradeBadge =
    canUpdateCompute &&
    isEligibleForFreeMicroUpgrade({
      planId: organization?.plan.id,
      computeSize: projectComputeSize,
    })

  return {
    project,
    isLoading: isEntitlementLoading || isLoadingProject || isLoadingOrganization,
    showMicroUpgradeBadge,
  }
}
