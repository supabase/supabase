import type { BackupsData } from '@/data/database/backups-query'
import type { NetworkRestrictionsData } from '@/data/network-restrictions/network-restrictions-query'
import type { SSLEnforcementData } from '@/data/ssl-enforcement/ssl-enforcement-query'

export interface ComplianceRequirement {
  id: string
  label: string
  href: string
  isMet: boolean
  isLoading: boolean
}

export function isSslEnforcementRequirementMet(data: SSLEnforcementData | undefined): boolean {
  return !!data?.appliedSuccessfully && !!data?.currentConfig.database
}

export function isNetworkRestrictionsRequirementMet(
  data: NetworkRestrictionsData | undefined
): boolean {
  const restrictedIps = data?.config?.dbAllowedCidrs ?? []
  const restrictedIpsV6 = data?.config?.dbAllowedCidrsV6 ?? []
  const isAllowedAll = restrictedIps.includes('0.0.0.0/0') || restrictedIpsV6.includes('::/0')
  const hasAnyRestriction = restrictedIps.length > 0 || restrictedIpsV6.length > 0
  // An empty allowlist (both v4 and v6) that has been applied means no IPs
  // are allowed in at all — stricter than any CIDR-based allowlist, not
  // "unconfigured". If either family still has a wide-open entry, the
  // restriction isn't actually in effect regardless of the other family.
  const isFullyLockedDown =
    restrictedIps.length === 0 && restrictedIpsV6.length === 0 && data?.status === 'applied'
  return !isAllowedAll && (isFullyLockedDown || hasAnyRestriction)
}

export function isPitrRequirementMet(data: BackupsData | undefined): boolean {
  return !!data?.pitr_enabled
}

export function getComplianceRequirements({
  projectRef,
  sslEnforcement,
  isLoadingSslEnforcement,
  networkRestrictions,
  isLoadingNetworkRestrictions,
  backups,
  isLoadingBackups,
}: {
  projectRef: string | undefined
  sslEnforcement: SSLEnforcementData | undefined
  isLoadingSslEnforcement: boolean
  networkRestrictions: NetworkRestrictionsData | undefined
  isLoadingNetworkRestrictions: boolean
  backups: BackupsData | undefined
  isLoadingBackups: boolean
}): ComplianceRequirement[] {
  return [
    {
      id: 'ssl-enforcement',
      label: 'Enforce SSL on incoming connections',
      href: `/project/${projectRef}/settings/database#ssl-configuration`,
      isMet: isSslEnforcementRequirementMet(sslEnforcement),
      isLoading: isLoadingSslEnforcement,
    },
    {
      id: 'network-restrictions',
      label: 'Restrict database access by IP address',
      href: `/project/${projectRef}/settings/database#network-restrictions`,
      isMet: isNetworkRestrictionsRequirementMet(networkRestrictions),
      isLoading: isLoadingNetworkRestrictions,
    },
    {
      id: 'pitr',
      label: 'Enable point-in-time recovery backups',
      href: `/project/${projectRef}/database/backups/pitr`,
      isMet: isPitrRequirementMet(backups),
      isLoading: isLoadingBackups,
    },
  ]
}
