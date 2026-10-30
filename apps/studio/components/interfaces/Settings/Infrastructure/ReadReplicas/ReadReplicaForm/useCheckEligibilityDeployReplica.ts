import { useParams } from 'common'

import { crossesCollationLineageBoundary } from './CollationLineage.utils'
import { useProjectUpgradeEligibilityQuery } from '@/data/config/project-upgrade-eligibility-query'
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

  const overdueInvoicesQuery = useOverdueInvoicesQuery({
    enabled: isNotOnHigherPlan,
  })
  const allOverdueInvoices = overdueInvoicesQuery.data
  const overdueInvoices = (allOverdueInvoices ?? []).filter(
    (x) => x.organization_id === project?.organization_id
  )
  const hasOverdueInvoices = overdueInvoices.length > 0 && isNotOnHigherPlan

  const replicasQuery = useReadReplicasQuery({ projectRef })
  const databases = replicasQuery.data ?? []

  const addonsQuery = useProjectAddonsQuery({ projectRef })
  const addons = addonsQuery.data
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

  const upgradeEligibilityQuery = useProjectUpgradeEligibilityQuery({ projectRef })
  const upgradeEligibility = upgradeEligibilityQuery.data
  const isCollationLineageCrossed =
    upgradeEligibility !== undefined &&
    crossesCollationLineageBoundary({
      sourceVersion: upgradeEligibility.current_app_version,
      targetVersions: upgradeEligibility.target_upgrade_versions.map((x) => x.app_version),
    })

  const queries = [overdueInvoicesQuery, replicasQuery, addonsQuery, upgradeEligibilityQuery]
  const isLoading = queries.some((query) => query.isLoading)
  const failedQueries = queries.filter((query) => query.isError)
  const isError = failedQueries.length > 0
  const failure: unknown = failedQueries[0]?.error
  const error =
    typeof failure === 'object' &&
    failure !== null &&
    'message' in failure &&
    typeof failure.message === 'string'
      ? { message: failure.message }
      : null
  const refetch = () => Promise.all(failedQueries.map((query) => query.refetch()))

  const canDeployReplica =
    !isLoading &&
    !isError &&
    !isReachedMaxReplicas &&
    !isCollationLineageCrossed &&
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
    isLoading,
    isError,
    error,
    refetch,
    hasOverdueInvoices,
    isAWSProvider,
    isAwsK8s,
    isPgVersionBelow15: currentPgVersion === undefined || currentPgVersion < 15,
    isBelowSmallCompute,
    isWalgNotEnabled: !isWalgEnabled,
    isProWithSpendCapEnabled,
    isReachedMaxReplicas,
    isHighAvailability,
    isCollationLineageCrossed,
    maxNumberOfReplicas,
  }
}
