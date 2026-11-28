import {
  DISK_LIMITS,
  DiskType,
} from '@/components/interfaces/DiskManagement/ui/DiskManagement.constants'

export interface IPv4DisabledReasonOptions {
  isAws: boolean
  isProjectActive: boolean
  projectUpdateDisabled: boolean
  canUpdateIPv4: boolean
  ipv4Enabled: boolean
  isHighAvailability: boolean
}

export const getIPv4DisabledReason = ({
  isAws,
  isProjectActive,
  projectUpdateDisabled,
  canUpdateIPv4,
  ipv4Enabled,
  isHighAvailability,
}: IPv4DisabledReasonOptions) => {
  if (isHighAvailability) {
    return 'Dedicated IPv4 address is unavailable on High Availability projects'
  }

  if (!isAws) {
    return 'Dedicated IPv4 address is only available for AWS projects'
  }

  if (!isProjectActive) {
    return 'Project must be active to update IPv4'
  }

  if (projectUpdateDisabled) {
    return 'Project updates are currently disabled'
  }

  if (!canUpdateIPv4 && !ipv4Enabled) {
    return 'You can only add IPv4 when your project network configuration is set to IPv6'
  }

  return undefined
}

export interface PitrDisabledReasonOptions {
  isProjectActive: boolean
  projectUpdateDisabled: boolean
  hasHipaaAddon: boolean
  sufficientPgVersion: boolean
  isOrioleDbInAws: boolean
  isHighAvailability: boolean
}

export const getPitrDisabledReason = ({
  isProjectActive,
  projectUpdateDisabled,
  hasHipaaAddon,
  sufficientPgVersion,
  isOrioleDbInAws,
  isHighAvailability,
}: PitrDisabledReasonOptions) => {
  if (isHighAvailability) {
    return 'Point in time recovery is unavailable on High Availability projects'
  }

  if (!isProjectActive) {
    return 'Project must be active to update PITR'
  }

  if (projectUpdateDisabled) {
    return 'Project updates are currently disabled'
  }

  if (hasHipaaAddon) {
    return 'PITR cannot be changed with HIPAA enabled'
  }

  if (!sufficientPgVersion) {
    return 'Your project is too old to enable PITR'
  }

  if (isOrioleDbInAws) {
    return 'Point in time recovery is not supported with OrioleDB'
  }

  return undefined
}

export interface CustomDomainDisabledReasonOptions {
  isProjectActive: boolean
  projectUpdateDisabled: boolean
  isHighAvailability: boolean
}

export const getCustomDomainDisabledReason = ({
  isProjectActive,
  projectUpdateDisabled,
  isHighAvailability,
}: CustomDomainDisabledReasonOptions) => {
  if (isHighAvailability) {
    return 'Custom domain is unavailable on High Availability projects'
  }

  if (!isProjectActive) {
    return 'Project must be active to update custom domain'
  }

  if (projectUpdateDisabled) {
    return 'Project updates are currently disabled'
  }

  return undefined
}

export type PitrAlertState =
  | 'hipaa'
  | 'hipaa-non-compliant'
  | 'legacy-project'
  | 'orioledb'
  | undefined

export const getPitrAlertState = ({
  hasHipaaAddon,
  hasHipaaCompliantPitr = true,
  sufficientPgVersion,
  isOrioleDbInAws,
}: Pick<PitrDisabledReasonOptions, 'hasHipaaAddon' | 'sufficientPgVersion' | 'isOrioleDbInAws'> & {
  hasHipaaCompliantPitr?: boolean
}): PitrAlertState => {
  if (hasHipaaAddon) {
    return hasHipaaCompliantPitr ? 'hipaa' : 'hipaa-non-compliant'
  }

  if (!sufficientPgVersion) {
    return 'legacy-project'
  }

  if (isOrioleDbInAws) {
    return 'orioledb'
  }

  return undefined
}

// The default instance size is not an add-on, so ci_micro counts as "not enabled"
export const DEFAULT_COMPUTE_SIZE = 'ci_micro'

export const isComputeAddonEnabled = (computeSize: string | null | undefined) =>
  !!computeSize && computeSize !== DEFAULT_COMPUTE_SIZE

export const getActiveCountLabel = (count: number) => `${count} active`

// Prices that don't come from the billing add-ons API, see packages/shared-data/pricing.ts
export const LOG_DRAIN_PRICE_LABEL = '$60 / drain / month'
export const SMS_MFA_PRICE_LABEL = '$75 / month'

/** Lowest paid variant price for an add-on type, ignoring free and excluded variants */
export const getLowestPaidPrice = (
  availableAddons: { type: string; variants: { identifier: string; price: number }[] }[],
  type: string,
  excludedIdentifiers: string[] = []
) => {
  const prices = (availableAddons.find((addon) => addon.type === type)?.variants ?? [])
    .filter((variant) => !excludedIdentifiers.includes(variant.identifier) && variant.price > 0)
    .map((variant) => variant.price)

  return prices.length > 0 ? Math.min(...prices) : undefined
}

/** The databases list includes the primary, which is not a read replica */
export const countReadReplicas = (databases: { identifier: string }[], projectRef?: string) =>
  databases.filter((database) => database.identifier !== projectRef).length

type DiskAttributes =
  | { type: 'gp3'; iops: number; throughput_mibps: number }
  | { type: 'io2'; iops: number }

/** io2, or gp3 with IOPS/throughput provisioned beyond what's included */
export const isAdvancedDiskEnabled = (attributes: DiskAttributes | undefined) => {
  if (!attributes) return false
  if (attributes.type === 'io2') return true

  return (
    attributes.iops > DISK_LIMITS[DiskType.GP3].includedIops ||
    attributes.throughput_mibps > DISK_LIMITS[DiskType.GP3].includedThroughput
  )
}

export const getAdvancedDiskDetail = (attributes: DiskAttributes | undefined) => {
  if (!attributes || !isAdvancedDiskEnabled(attributes)) return 'Usage based'
  if (attributes.type === 'io2')
    return `High-performance · ${attributes.iops.toLocaleString()} IOPS`

  return `${attributes.iops.toLocaleString()} IOPS · ${attributes.throughput_mibps.toLocaleString()} MiB/s`
}
