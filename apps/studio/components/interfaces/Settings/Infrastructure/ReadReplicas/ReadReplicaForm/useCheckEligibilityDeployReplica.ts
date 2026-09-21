import { useParams } from 'common'

import { useOverdueInvoicesQuery } from '@/data/invoices/invoices-overdue-query'
import {
  getMaxReplicas,
  READ_REPLICA_COMPUTE_CAPS,
  useReadReplicasQuery,
} from '@/data/read-replicas/replicas-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import {
  useIsAwsK8sCloudProvider,
  useIsHighAvailability,
  useSelectedProjectQuery,
} from '@/hooks/misc/useSelectedProject'

export const useCheckEligibilityDeployReplica = () => {
  const { ref: projectRef } = useParams()
  const isAwsK8s = useIsAwsK8sCloudProvider()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { hasAccess: hasReadReplicaAccess } = useCheckEntitlements('instances.read_replicas')
  const isAWSProvider = project?.cloud_provider === 'AWS'
  const isWalgEnabled = project?.is_physical_backups_enabled
  const isNotOnHigherPlan = !['team', 'enterprise', 'platform'].includes(org?.plan.id ?? '')
  const isProWithSpendCapEnabled = org?.plan.id === 'pro' && !org.usage_billing_enabled
  const isHighAvailability = useIsHighAvailability()

  const { data: allOverdueInvoices } = useOverdueInvoicesQuery({
    enabled: isNotOnHigherPlan,
  })
  const overdueInvoices = (allOverdueInvoices ?? []).filter(
    (x) => x.organization_id === project?.organization_id
  )
  const hasOverdueInvoices = overdueInvoices.length > 0 && isNotOnHigherPlan

  const { data: databases = [] } = useReadReplicasQuery({ projectRef })

  const { data: addons } = useProjectAddonsQuery({ projectRef })
  // Will be following the primary's compute size for the time being
  const currentComputeAddon = addons?.selected_addons.find(
    (addon) => addon.type === 'compute_instance'
  )?.variant.identifier

  const isBelowSmallCompute =
    currentComputeAddon === undefined || READ_REPLICA_COMPUTE_CAPS[currentComputeAddon] === 0
  const maxNumberOfReplicas = getMaxReplicas(currentComputeAddon)
  const isReachedMaxReplicas =
    (databases ?? []).filter((db) => db.identifier !== projectRef).length >= maxNumberOfReplicas

  const parsedPgVersion = Number(
    (project?.dbVersion ?? '').split('supabase-postgres-')[1]?.split('.')[0]
  )
  const currentPgVersion = Number.isNaN(parsedPgVersion) ? undefined : parsedPgVersion

  const canDeployReplica =
    !isReachedMaxReplicas &&
    currentPgVersion !== undefined &&
    currentPgVersion >= 15 &&
    isAWSProvider &&
    hasReadReplicaAccess &&
    isWalgEnabled &&
    !hasOverdueInvoices &&
    !isAwsK8s &&
    !isProWithSpendCapEnabled &&
    !isBelowSmallCompute &&
    !isHighAvailability

  return {
    can: canDeployReplica,
    hasOverdueInvoices,
    isAWSProvider,
    isAwsK8s,
    isPgVersionBelow15: currentPgVersion === undefined || currentPgVersion < 15,
    isBelowSmallCompute,
    isWalgNotEnabled: !isWalgEnabled,
    isProWithSpendCapEnabled,
    isReachedMaxReplicas,
    isHighAvailability,
    maxNumberOfReplicas,
  }
}
